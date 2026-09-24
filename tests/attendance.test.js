import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../src/app.js";
import prisma from "../src/lib/prisma.js";
import { signAccessToken } from "../src/utils/jwt.js";

const offeringId = "00000000-0000-0000-0000-000000000400";
const facultyBToken = signAccessToken({ id: "00000000-0000-0000-0000-000000000101", role: "FACULTY" });
let server;
let baseUrl;
let facultyToken;
let studentToken;
let sessionId;
const sessionDate = `${2040 + (Date.now() % 10)}-01-${String((Date.now() % 27) + 1).padStart(2, "0")}`;

before(async () => {
  const previousSessions = await prisma.attendanceSession.findMany({
    where: { subjectOfferingId: offeringId, sessionDate: new Date(`${sessionDate}T00:00:00.000Z`) },
    select: { id: true }
  });
  const previousSessionIds = previousSessions.map((session) => session.id);
  if (previousSessionIds.length > 0) {
    await prisma.attendanceRecord.deleteMany({ where: { attendanceSessionId: { in: previousSessionIds } } });
    await prisma.attendanceSession.deleteMany({ where: { id: { in: previousSessionIds } } });
  }
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  facultyToken = await login("FACULTY");
  studentToken = await login("STUDENT");
});

after(async () => {
  if (sessionId) {
    await prisma.attendanceRecord.deleteMany({ where: { attendanceSessionId: sessionId } }).catch(() => {});
    await prisma.attendanceSession.delete({ where: { id: sessionId } }).catch(() => {});
  }
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

async function login(role) {
  const { body } = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ role })
  });
  return body.data.token;
}

function facultyRequest(path, options = {}) {
  return request(path, { ...options, headers: { authorization: `Bearer ${facultyToken}`, ...options.headers } });
}

test("session creation initializes active enrollments as UNMARKED", async () => {
  const created = await facultyRequest("/api/v1/attendance/sessions", {
    method: "POST",
    body: JSON.stringify({ subjectOfferingId: offeringId, sessionDate, period: 1 })
  });
  assert.equal(created.response.status, 201);
  sessionId = created.body.data.id;
  assert.equal(created.body.data.status, "DRAFT");

  const detail = await facultyRequest(`/api/v1/attendance/sessions/${sessionId}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.data.attendanceRecords.length, 13);
  assert.ok(detail.body.data.attendanceRecords.every((record) => record.status === "UNMARKED"));
});

test("faculty ownership and role authorization are enforced", async () => {
  const otherFaculty = await request(`/api/v1/attendance/sessions/${sessionId}`, {
    headers: { authorization: `Bearer ${facultyBToken}` }
  });
  assert.equal(otherFaculty.response.status, 403);

  const studentCreate = await request("/api/v1/attendance/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ subjectOfferingId: offeringId, sessionDate: "2040-01-02", period: 1 })
  });
  assert.equal(studentCreate.response.status, 403);

  const unauthenticated = await request(`/api/v1/attendance/sessions/${sessionId}`);
  assert.equal(unauthenticated.response.status, 401);
});

test("submission requires every record to be marked", async () => {
  const incomplete = await facultyRequest(`/api/v1/attendance/sessions/${sessionId}/submit`, { method: "POST" });
  assert.equal(incomplete.response.status, 409);
  assert.equal(incomplete.body.error.code, "ATTENDANCE_NOT_COMPLETE");

  const stillDraft = await prisma.attendanceSession.findUnique({ where: { id: sessionId }, select: { status: true } });
  assert.equal(stillDraft.status, "DRAFT");
});

test("draft records can be marked, then submitted sessions are locked", async () => {
  const detail = await facultyRequest(`/api/v1/attendance/sessions/${sessionId}`);
  for (const record of detail.body.data.attendanceRecords) {
    const updated = await facultyRequest(`/api/v1/attendance/records/${record.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: record.id === detail.body.data.attendanceRecords[0].id ? "PRESENT" : "ABSENT" })
    });
    assert.equal(updated.response.status, 200);
  }

  const submitted = await facultyRequest(`/api/v1/attendance/sessions/${sessionId}/submit`, { method: "POST" });
  assert.equal(submitted.response.status, 200);
  assert.equal(submitted.body.data.status, "SUBMITTED");
  assert.ok(submitted.body.data.submittedAt);

  const lockedRecord = detail.body.data.attendanceRecords[0];
  const updateAfterSubmit = await facultyRequest(`/api/v1/attendance/records/${lockedRecord.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "LATE" })
  });
  assert.equal(updateAfterSubmit.response.status, 409);
  assert.equal(updateAfterSubmit.body.error.code, "ATTENDANCE_SESSION_LOCKED");
});

test("duplicate session and invalid status are rejected", async () => {
  const duplicate = await facultyRequest("/api/v1/attendance/sessions", {
    method: "POST",
    body: JSON.stringify({ subjectOfferingId: offeringId, sessionDate, period: 1 })
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.body.error.code, "ATTENDANCE_SESSION_ALREADY_EXISTS");

  const invalidStatus = await facultyRequest(`/api/v1/attendance/records/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "UNMARKED" })
  });
  assert.equal(invalidStatus.response.status, 422);
});

test("faculty session listing is scoped to assigned offerings", async () => {
  const listed = await facultyRequest("/api/v1/attendance/sessions?status=SUBMITTED&page=1&limit=20");
  assert.equal(listed.response.status, 200);
  assert.ok(listed.body.data.items.every((session) => session.subjectOfferingId === offeringId));
});

test("students can read only their own attendance through the documented route", async () => {
  const studentAttendance = await request("/api/v1/students/me/attendance?page=1&limit=20", {
    headers: { authorization: `Bearer ${studentToken}` }
  });
  assert.equal(studentAttendance.response.status, 200);
  assert.ok(Array.isArray(studentAttendance.body.data.items));
});
