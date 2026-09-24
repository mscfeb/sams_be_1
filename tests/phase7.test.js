import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../src/app.js";
import prisma from "../src/lib/prisma.js";

const ids = {
  offering: "00000000-0000-0000-0000-000000000400",
  record: "00000000-0000-0000-0000-000000001850"
};

let server;
let baseUrl;
const tokens = {};

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  for (const role of ["ADMIN", "FACULTY", "STUDENT"]) {
    const result = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ role })
    });
    tokens[role] = result.body.data.token;
  }
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers }
  });
  return { response, body: await response.json() };
}

function asRole(role, path, options = {}) {
  return request(path, {
    ...options,
    headers: { authorization: `Bearer ${tokens[role]}`, ...options.headers }
  });
}

test("student summaries count submitted attendance and exclude drafts", async () => {
  const student = await prisma.student.findUnique({
    where: { userId: "00000000-0000-0000-0000-000000000200" },
    select: { id: true }
  });
  const expectedRecords = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id, attendanceSession: { status: "SUBMITTED" } },
    select: { status: true }
  });
  const result = await asRole("STUDENT", "/api/v1/students/me/attendance");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.overall.totalSessions, expectedRecords.length);
  assert.equal(result.body.data.overall.present, expectedRecords.filter((record) => record.status === "PRESENT").length);
  assert.equal(result.body.data.overall.absent, expectedRecords.filter((record) => record.status === "ABSENT").length);
  assert.equal(result.body.data.overall.late, expectedRecords.filter((record) => record.status === "LATE").length);
  assert.ok(result.body.data.overall.totalSessions > 0);
  assert.equal(result.body.data.items.some((item) => item.attendanceSession?.status === "DRAFT"), false);
});

test("student history supports database-side subject and date filters", async () => {
  const result = await asRole("STUDENT", "/api/v1/students/me/attendance/history?subjectOfferingId=00000000-0000-0000-0000-000000000400&from=2026-08-03&to=2026-08-10&limit=100");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.pagination.totalItems, 8);
  assert.equal(result.body.data.items.length, 8);
  assert.ok(result.body.data.items.every((item) => item.attendanceSession.subjectOffering.id === ids.offering));
});

test("low attendance report is thresholded and faculty scoped", async () => {
  const admin = await asRole("ADMIN", "/api/v1/reports/low-attendance?threshold=75&subjectOfferingId=00000000-0000-0000-0000-000000000400&limit=100");
  assert.equal(admin.response.status, 200);
  assert.ok(admin.body.data.items.length >= 1);
  assert.ok(admin.body.data.items.every((item) => item.attendance < 75));

  const faculty = await asRole("FACULTY", "/api/v1/reports/low-attendance?threshold=75&limit=100");
  assert.equal(faculty.response.status, 200);
  assert.ok(faculty.body.data.items.every((item) => item.subjectOfferingId === ids.offering));

  const student = await asRole("STUDENT", "/api/v1/reports/low-attendance");
  assert.equal(student.response.status, 403);
});

test("faculty can create and admin can reject a submitted correction", async () => {
  const existingRecord = await prisma.attendanceRecord.findUnique({ where: { id: ids.record }, select: { status: true } });
  const requestedStatus = existingRecord.status === "PRESENT" ? "ABSENT" : "PRESENT";
  const created = await asRole("FACULTY", "/api/v1/corrections", {
    method: "POST",
    body: JSON.stringify({ attendanceRecordId: ids.record, newStatus: requestedStatus, reason: "Approved attendance evidence" })
  });
  assert.equal(created.response.status, 201);
  const correctionId = created.body.data.id;
  assert.equal(created.body.data.status, "PENDING");

  const duplicate = await asRole("FACULTY", "/api/v1/corrections", {
    method: "POST",
    body: JSON.stringify({ attendanceRecordId: ids.record, newStatus: requestedStatus, reason: "Duplicate request" })
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.body.error.code, "CORRECTION_ALREADY_PENDING");

  const rejected = await asRole("ADMIN", `/api/v1/corrections/${correctionId}/reject`, { method: "POST" });
  assert.equal(rejected.response.status, 200);
  assert.equal(rejected.body.data.status, "REJECTED");

  const record = await prisma.attendanceRecord.findUnique({ where: { id: ids.record }, select: { status: true } });
  assert.equal(record.status, existingRecord.status);
});

test("admin approval changes the record and therefore derived attendance", async () => {
  const before = await prisma.attendanceRecord.findUnique({ where: { id: ids.record }, select: { status: true } });
  const newStatus = before.status === "PRESENT" ? "ABSENT" : "PRESENT";
  const created = await asRole("FACULTY", "/api/v1/corrections", {
    method: "POST",
    body: JSON.stringify({ attendanceRecordId: ids.record, newStatus, reason: "Correction approval test" })
  });
  assert.equal(created.response.status, 201);

  const approved = await asRole("ADMIN", `/api/v1/corrections/${created.body.data.id}/approve`, { method: "POST" });
  assert.equal(approved.response.status, 200);
  assert.equal(approved.body.data.status, "APPROVED");

  const afterApproval = await prisma.attendanceRecord.findUnique({ where: { id: ids.record }, select: { status: true } });
  assert.equal(afterApproval.status, newStatus);
});

test("correction review and history require authorization", async () => {
  const unauthenticated = await request("/api/v1/corrections/00000000-0000-0000-0000-000000004000/approve", { method: "POST" });
  assert.equal(unauthenticated.response.status, 401);

  const facultyReview = await asRole("FACULTY", "/api/v1/corrections/00000000-0000-0000-0000-000000004000/approve", { method: "POST" });
  assert.equal(facultyReview.response.status, 403);

  const studentHistory = await asRole("STUDENT", "/api/v1/students/me/attendance/history?page=1&limit=1");
  assert.equal(studentHistory.response.status, 200);
});
