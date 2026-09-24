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
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "content-type": "application/json", ...options.headers },
    ...options
  });
  return { response, body: await response.json() };
}

test("health endpoint remains available", async () => {
  const { response, body } = await request("/health");
  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, data: { status: "ok" } });
});

test("login issues a token for every demo role", async () => {
  for (const role of ["ADMIN", "FACULTY", "STUDENT"]) {
    const { response, body } = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ role })
    });
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user.role, role);
    assert.equal(typeof body.data.token, "string");
    tokens[role] = body.data.token;
  }
});

test("invalid login role is rejected", async () => {
  const { response, body } = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ role: "UNKNOWN" })
  });
  assert.equal(response.status, 422);
  assert.equal(body.error.code, "VALIDATION_ERROR");
});

test("auth/me returns the identity from the token", async () => {
  const { response, body } = await request("/api/v1/auth/me", {
    headers: { authorization: `Bearer ${tokens.STUDENT}` }
  });
  assert.equal(response.status, 200);
  assert.equal(body.data.user.role, "STUDENT");
  assert.equal(body.data.user.email, "student01@example.com");
});

test("missing and malformed tokens return 401", async () => {
  const missing = await request("/api/v1/auth/me");
  assert.equal(missing.response.status, 401);

  const malformed = await request("/api/v1/auth/me", {
    headers: { authorization: "Bearer invalid-token" }
  });
  assert.equal(malformed.response.status, 401);
});

test("RBAC allows the matching role and rejects other roles", async () => {
  const admin = await request("/api/v1/auth/test/admin", {
    headers: { authorization: `Bearer ${tokens.ADMIN}` }
  });
  assert.equal(admin.response.status, 200);

  const facultyOnAdmin = await request("/api/v1/auth/test/admin", {
    headers: { authorization: `Bearer ${tokens.FACULTY}` }
  });
  assert.equal(facultyOnAdmin.response.status, 403);

  const student = await request("/api/v1/auth/test/student", {
    headers: { authorization: `Bearer ${tokens.STUDENT}` }
  });
  assert.equal(student.response.status, 200);
});
