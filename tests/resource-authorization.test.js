import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../src/app.js";
import prisma from "../src/lib/prisma.js";
import { signAccessToken } from "../src/utils/jwt.js";

const ids = {
  offeringA: "00000000-0000-0000-0000-000000000400",
  offeringB: "00000000-0000-0000-0000-000000000401",
  sessionA: "00000000-0000-0000-0000-000000000500",
  studentA: "00000000-0000-0000-0000-000000000300",
  studentB: "00000000-0000-0000-0000-000000000304",
  recordA: "00000000-0000-0000-0000-000000001000",
  recordB: "00000000-0000-0000-0000-000000001001"
};

let server;
let baseUrl;
const tokens = {};

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  for (const role of ["ADMIN", "FACULTY", "STUDENT"]) {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    });
    const body = await response.json();
    tokens[role] = body.data.token;
  }
  tokens.FACULTY_B = signAccessToken({
    id: "00000000-0000-0000-0000-000000000101",
    role: "FACULTY"
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

async function request(path, role, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      authorization: role ? `Bearer ${tokens[role]}` : "",
      ...options.headers
    },
    ...options
  });
  return { response, body: await response.json() };
}

test("admin can access academic resources", async () => {
  const offering = await request(`/api/v1/auth/access/offerings/${ids.offeringB}`, "ADMIN");
  assert.equal(offering.response.status, 200);

  const student = await request(`/api/v1/auth/access/students/${ids.studentB}`, "ADMIN");
  assert.equal(student.response.status, 200);
});

test("faculty access follows SubjectOffering.faculty assignment", async () => {
  const ownOffering = await request(`/api/v1/auth/access/offerings/${ids.offeringA}`, "FACULTY");
  assert.equal(ownOffering.response.status, 200);

  const otherOffering = await request(`/api/v1/auth/access/offerings/${ids.offeringB}`, "FACULTY");
  assert.equal(otherOffering.response.status, 403);
});

test("faculty session access traverses the offering assignment", async () => {
  const ownSession = await request(`/api/v1/auth/access/sessions/${ids.sessionA}`, "FACULTY");
  assert.equal(ownSession.response.status, 200);

  const otherFaculty = await request(`/api/v1/auth/access/sessions/${ids.sessionA}`, "FACULTY_B");
  assert.equal(otherFaculty.response.status, 403);
});

test("student access follows ownership and active enrollment", async () => {
  const ownStudent = await request(`/api/v1/auth/access/students/${ids.studentA}`, "STUDENT");
  assert.equal(ownStudent.response.status, 200);

  const otherStudent = await request(`/api/v1/auth/access/students/${ids.studentB}`, "STUDENT");
  assert.equal(otherStudent.response.status, 403);

  const enrolledOffering = await request(`/api/v1/auth/access/offerings/${ids.offeringA}`, "STUDENT");
  assert.equal(enrolledOffering.response.status, 200);

  const unenrolledOffering = await request(`/api/v1/auth/access/offerings/${ids.offeringB}`, "STUDENT");
  assert.equal(unenrolledOffering.response.status, 403);
});

test("student attendance record access follows record ownership", async () => {
  const ownRecord = await request(`/api/v1/auth/access/records/${ids.recordA}`, "STUDENT");
  assert.equal(ownRecord.response.status, 200);

  const otherRecord = await request(`/api/v1/auth/access/records/${ids.recordB}`, "STUDENT");
  assert.equal(otherRecord.response.status, 403);
});

test("resource access requires authentication and validates IDs", async () => {
  const unauthenticated = await request(`/api/v1/auth/access/offerings/${ids.offeringA}`);
  assert.equal(unauthenticated.response.status, 401);

  const invalidId = await request("/api/v1/auth/access/offerings/not-a-uuid", "ADMIN");
  assert.equal(invalidId.response.status, 422);
  assert.equal(invalidId.body.error.code, "VALIDATION_ERROR");
});
