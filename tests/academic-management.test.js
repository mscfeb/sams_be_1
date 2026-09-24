import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../src/app.js";
import prisma from "../src/lib/prisma.js";

let server;
let baseUrl;
const tokens = {};
const created = {};
const suffix = Date.now().toString();

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  for (const role of ["ADMIN", "FACULTY", "STUDENT"]) {
    const { body } = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ role })
    });
    tokens[role] = body.data.token;
  }
});

after(async () => {
  if (created.enrollmentId) await prisma.enrollment.delete({ where: { id: created.enrollmentId } }).catch(() => {});
  if (created.offeringId) await prisma.subjectOffering.delete({ where: { id: created.offeringId } }).catch(() => {});
  if (created.studentId) {
    const student = await prisma.student.findUnique({ where: { id: created.studentId }, select: { userId: true } });
    await prisma.student.delete({ where: { id: created.studentId } }).catch(() => {});
    if (student) await prisma.user.delete({ where: { id: student.userId } }).catch(() => {});
  }
  if (created.facultyId) {
    const faculty = await prisma.faculty.findUnique({ where: { id: created.facultyId }, select: { userId: true } });
    await prisma.faculty.delete({ where: { id: created.facultyId } }).catch(() => {});
    if (faculty) await prisma.user.delete({ where: { id: faculty.userId } }).catch(() => {});
  }
  if (created.subjectId) await prisma.subject.delete({ where: { id: created.subjectId } }).catch(() => {});
  if (created.sectionId) await prisma.section.delete({ where: { id: created.sectionId } }).catch(() => {});
  if (created.academicYearId) await prisma.academicYear.delete({ where: { id: created.academicYearId } }).catch(() => {});
  if (created.departmentId) await prisma.department.delete({ where: { id: created.departmentId } }).catch(() => {});
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl ?? "http://127.0.0.1"}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers }
  });
  return { response, body: await response.json() };
}

function adminRequest(path, options = {}) {
  return request(path, { ...options, headers: { authorization: `Bearer ${tokens.ADMIN}`, ...options.headers } });
}

test("all academic management endpoints require ADMIN", async () => {
  const noToken = await request("/api/v1/departments");
  assert.equal(noToken.response.status, 401);

  const faculty = await request("/api/v1/departments", { headers: { authorization: `Bearer ${tokens.FACULTY}` } });
  assert.equal(faculty.response.status, 403);

  const student = await request("/api/v1/departments", { headers: { authorization: `Bearer ${tokens.STUDENT}` } });
  assert.equal(student.response.status, 403);
});

test("admin manages the academic dependency chain with pagination and audit logs", async () => {
  const department = await adminRequest("/api/v1/departments", {
    method: "POST",
    body: JSON.stringify({ code: `T${suffix.slice(-8)}`, name: "Test Engineering" })
  });
  assert.equal(department.response.status, 201);
  created.departmentId = department.body.data.id;

  const duplicateDepartment = await adminRequest("/api/v1/departments", {
    method: "POST",
    body: JSON.stringify({ code: department.body.data.code, name: "Duplicate" })
  });
  assert.equal(duplicateDepartment.response.status, 409);

  const year = await adminRequest("/api/v1/academic-years", {
    method: "POST",
    body: JSON.stringify({ name: `Test-${suffix}`, startDate: "2027-08-01", endDate: "2028-07-31" })
  });
  assert.equal(year.response.status, 201);
  created.academicYearId = year.body.data.id;

  const invalidYear = await adminRequest("/api/v1/academic-years", {
    method: "POST",
    body: JSON.stringify({ name: `Invalid-${suffix}`, startDate: "2028-08-01", endDate: "2027-07-31" })
  });
  assert.equal(invalidYear.response.status, 422);

  const section = await adminRequest("/api/v1/sections", {
    method: "POST",
    body: JSON.stringify({ name: "TEST-A", program: "B.E. Testing", semester: 5, departmentId: created.departmentId, academicYearId: created.academicYearId })
  });
  assert.equal(section.response.status, 201);
  created.sectionId = section.body.data.id;

  const subject = await adminRequest("/api/v1/subjects", {
    method: "POST",
    body: JSON.stringify({ code: `TS${suffix.slice(-6)}`, name: "API Testing", credits: 3, departmentId: created.departmentId })
  });
  assert.equal(subject.response.status, 201);
  created.subjectId = subject.body.data.id;

  const faculty = await adminRequest("/api/v1/faculty", {
    method: "POST",
    body: JSON.stringify({ email: `faculty-${suffix}@example.com`, employeeNumber: `TEST-${suffix}`, firstName: "Test", lastName: "Faculty", departmentId: created.departmentId })
  });
  assert.equal(faculty.response.status, 201);
  created.facultyId = faculty.body.data.id;

  const student = await adminRequest("/api/v1/students", {
    method: "POST",
    body: JSON.stringify({ email: `student-${suffix}@example.com`, studentNumber: `TEST-${suffix}`, firstName: "Test", lastName: "Student", departmentId: created.departmentId, sectionId: created.sectionId })
  });
  assert.equal(student.response.status, 201);
  created.studentId = student.body.data.id;

  const offering = await adminRequest("/api/v1/subject-offerings", {
    method: "POST",
    body: JSON.stringify({ subjectId: created.subjectId, facultyId: created.facultyId, sectionId: created.sectionId, academicYearId: created.academicYearId, semester: 5 })
  });
  assert.equal(offering.response.status, 201);
  created.offeringId = offering.body.data.id;

  const enrollment = await adminRequest("/api/v1/enrollments", {
    method: "POST",
    body: JSON.stringify({ studentId: created.studentId, subjectOfferingId: created.offeringId })
  });
  assert.equal(enrollment.response.status, 201);
  created.enrollmentId = enrollment.body.data.id;

  const duplicateEnrollment = await adminRequest("/api/v1/enrollments", {
    method: "POST",
    body: JSON.stringify({ studentId: created.studentId, subjectOfferingId: created.offeringId })
  });
  assert.equal(duplicateEnrollment.response.status, 409);

  const filtered = await adminRequest(`/api/v1/sections?departmentId=${created.departmentId}&page=1&limit=1`);
  assert.equal(filtered.response.status, 200);
  assert.equal(filtered.body.data.items.length, 1);
  assert.equal(filtered.body.data.pagination.limit, 1);

  const updated = await adminRequest(`/api/v1/departments/${created.departmentId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: "Updated Test Engineering" })
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.name, "Updated Test Engineering");

  const auditCount = await prisma.auditLog.count({ where: { entityId: created.departmentId, userId: "00000000-0000-0000-0000-000000000090" } });
  assert.equal(auditCount, 2);
});

test("invalid foreign keys and empty patches are rejected cleanly", async () => {
  const invalidSection = await adminRequest("/api/v1/sections", {
    method: "POST",
    body: JSON.stringify({ name: "Invalid", program: "Invalid", semester: 1, departmentId: "00000000-0000-0000-0000-000000000099", academicYearId: "00000000-0000-0000-0000-000000000099" })
  });
  assert.equal(invalidSection.response.status, 404);

  const emptyPatch = await adminRequest(`/api/v1/departments/${created.departmentId}`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
  assert.equal(emptyPatch.response.status, 422);
});
