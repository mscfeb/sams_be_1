import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../src/app.js";
import prisma from "../src/lib/prisma.js";

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

test("admin dashboard returns academic and attendance overview", async () => {
  const result = await asRole("ADMIN", "/api/v1/dashboard/admin");
  assert.equal(result.response.status, 200);
  assert.ok(result.body.data.academic.departments >= 3);
  assert.ok(result.body.data.academic.students >= 50);
  assert.ok(result.body.data.academic.activeEnrollments >= 1);
  assert.ok(result.body.data.attendance.submittedSessions >= 25);
  assert.ok(result.body.data.attendance.overallAttendance >= 0);
  assert.equal(typeof result.body.data.attendance.pendingCorrections, "number");
  assert.equal(result.body.data.lowAttendanceThreshold, 75);
});

test("faculty dashboard is scoped to assigned offerings and sessions", async () => {
  const result = await asRole("FACULTY", "/api/v1/dashboard/faculty?limit=5");
  assert.equal(result.response.status, 200);
  assert.ok(result.body.data.offerings.length >= 1);
  assert.ok(result.body.data.offerings.every((offering) => offering.id));
  assert.ok(result.body.data.sessions.recent.length <= 5);
  assert.ok(result.body.data.sessions.recent.every((session) => session.subjectOffering));
  assert.equal(typeof result.body.data.lowAttendanceStudents, "number");
});

test("student dashboard reuses the Phase 7 attendance calculation", async () => {
  const dashboard = await asRole("STUDENT", "/api/v1/dashboard/student?limit=5");
  const attendance = await asRole("STUDENT", "/api/v1/students/me/attendance");
  assert.equal(dashboard.response.status, 200);
  assert.equal(attendance.response.status, 200);
  assert.deepEqual(dashboard.body.data.attendance.overall, attendance.body.data.overall);
  assert.deepEqual(dashboard.body.data.attendance.subjects, attendance.body.data.subjects);
  assert.ok(dashboard.body.data.enrolledSubjects.length >= 1);
  assert.ok(dashboard.body.data.attendance.recent.length <= 5);
  assert.ok(dashboard.body.data.lowAttendanceSubjects.every((subject) => subject.lowAttendance));
});

test("dashboard endpoints enforce authentication and roles", async () => {
  const unauthenticated = await request("/api/v1/dashboard/admin");
  assert.equal(unauthenticated.response.status, 401);

  const facultyOnAdmin = await asRole("FACULTY", "/api/v1/dashboard/admin");
  assert.equal(facultyOnAdmin.response.status, 403);

  const studentOnFaculty = await asRole("STUDENT", "/api/v1/dashboard/faculty");
  assert.equal(studentOnFaculty.response.status, 403);

  const adminOnStudent = await asRole("ADMIN", "/api/v1/dashboard/student");
  assert.equal(adminOnStudent.response.status, 403);
});

test("dashboard limit is bounded and validated", async () => {
  const invalid = await asRole("FACULTY", "/api/v1/dashboard/faculty?limit=21");
  assert.equal(invalid.response.status, 422);
  assert.equal(invalid.body.error.code, "VALIDATION_ERROR");
});
