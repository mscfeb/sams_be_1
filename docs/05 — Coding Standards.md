# Smart Attendance Management System
## Coding Standards

**Version:** 1.0  
**Language:** JavaScript  
**Runtime:** Node.js

---

# 1. Purpose

These standards keep AI-generated and human-written code consistent.

The goal is:

- Readable code
- Small functions
- Clear module boundaries
- Predictable APIs
- Minimal abstraction
- Safe database access
- Easy code review

---

# 2. JavaScript Standard

Use modern JavaScript.

The backend uses ES Modules.

`package.json`:

```json
{
  "type": "module"
}
```

Use:

```javascript
import express from "express";
```

Do not mix:

```javascript
require()
```

with ES module imports.

---

# 3. Strictness

Although JavaScript is dynamically typed, code should behave as if strong contracts exist.

Use:

- Zod validation
- Clear function parameters
- Explicit return objects
- Consistent naming
- Small functions

Avoid unnecessary dynamic objects.

---

# 4. No Unnecessary `any`-Style Behavior

JavaScript does not have TypeScript's `any`, but avoid code that intentionally destroys structure.

Avoid:

```javascript
const data = JSON.parse(input);
data.foo.bar.baz;
```

without validation.

External data must be validated.

---

# 5. Naming

## Variables

Use camelCase.

```javascript
const studentId = "...";
const attendanceSession = {};
```

## Functions

Use camelCase.

```javascript
createAttendanceSession()
getStudentAttendance()
approveCorrection()
```

## Classes

Use PascalCase.

```javascript
AppError
```

## Constants

Use uppercase when they represent true application constants.

```javascript
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
```

---

# 6. File Naming

Use descriptive lowercase filenames.

```text
attendance.service.js
attendance.controller.js
attendance.routes.js
attendance.validation.js
auth.middleware.js
```

Do not use inconsistent naming such as:

```text
AttendanceService.js
attendanceService.js
attendance_service.js
```

---

# 7. Module Organization

Feature code belongs together.

Preferred:

```text
modules/
└── attendance/
    ├── attendance.routes.js
    ├── attendance.controller.js
    ├── attendance.service.js
    └── attendance.validation.js
```

Avoid:

```text
controllers/
services/
models/
routes/
```

containing hundreds of unrelated files.

---

# 8. Controllers Must Be Thin

Bad:

```javascript
router.post("/sessions", async (req, res) => {
  // validate faculty
  // query offering
  // query students
  // create session
  // create records
  // calculate attendance
  // send response
});
```

Good:

```javascript
router.post(
  "/sessions",
  authenticate,
  requireRole("FACULTY"),
  validate(createSessionSchema),
  attendanceController.createSession
);
```

Then:

```javascript
async function createSession(req, res, next) {
  try {
    const result = await attendanceService.createSession({
      ...req.body,
      facultyUserId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
```

---

# 9. Business Logic Belongs in Services

Examples:

```text
attendance.service.js
correction.service.js
student.service.js
subject-offering.service.js
```

Services should implement business rules.

---

# 10. Avoid Giant Services

If a service becomes too large, split responsibilities.

Bad:

```text
attendance.service.js
2000 lines
```

Potential separation:

```text
attendance-session.service.js
attendance-record.service.js
attendance-report.service.js
```

Only split when complexity justifies it.

---

# 11. Prisma Access

Use the shared Prisma client.

```javascript
import prisma from "../../lib/prisma.js";
```

Do not instantiate:

```javascript
new PrismaClient()
```

inside individual services.

---

# 12. Database Queries

Prefer selecting only required fields.

Avoid:

```javascript
prisma.student.findMany()
```

when the endpoint only needs:

```text
id
name
studentNumber
```

Prefer:

```javascript
prisma.student.findMany({
  select: {
    id: true,
    studentNumber: true,
    firstName: true,
    lastName: true
  }
});
```

This reduces unnecessary data transfer.

---

# 13. N+1 Query Avoidance

Avoid:

```javascript
for (const student of students) {
  await prisma.attendanceRecord.findMany({
    where: { studentId: student.id }
  });
}
```

Prefer a single query with relations or aggregation where possible.

---

# 14. Transactions

Use Prisma transactions for operations involving multiple related mutations.

Example:

```javascript
await prisma.$transaction(async (tx) => {
  const session = await tx.attendanceSession.create(...);

  await tx.attendanceRecord.createMany(...);

  return session;
});
```

---

# 15. No Silent Transaction Failures

Never catch a transaction error and continue as if the operation succeeded.

Bad:

```javascript
try {
  await prisma.$transaction(...);
} catch (error) {
  console.log(error);
}

return success;
```

Good:

```javascript
try {
  await prisma.$transaction(...);
} catch (error) {
  throw error;
}
```

The global error middleware handles the response.

---

# 16. Error Handling

Use application errors.

Example:

```javascript
throw new AppError(
  404,
  "STUDENT_NOT_FOUND",
  "Student was not found."
);
```

Do not return random error structures.

---

# 17. HTTP Status Codes

Use meaningful status codes.

```text
200 → successful read/update
201 → successful creation
204 → successful operation with no response body

400 → malformed request
401 → authentication missing/invalid
403 → authenticated but not authorized
404 → resource not found
409 → business conflict
422 → validation error
500 → unexpected server error
```

---

# 18. API Response Consistency

Success:

```javascript
{
  success: true,
  data: result
}
```

Error:

```javascript
{
  success: false,
  error: {
    code: "SOME_ERROR",
    message: "Human-readable message"
  }
}
```

Do not create module-specific response formats.

---

# 19. Authentication Rules

Never trust client identity fields when JWT provides the identity.

Bad:

```javascript
const { facultyId } = req.body;
```

Good:

```javascript
const facultyId = req.user.id;
```

The same applies to:

```text
createdBy
requestedBy
markedBy
reviewedBy
```

---

# 20. Authorization

Frontend authorization is not security.

This:

```javascript
if (user.role === "ADMIN") {
  showAdminButton();
}
```

is only UX.

The backend must still enforce:

```javascript
requireRole("ADMIN")
```

and resource-level ownership.

---

# 21. Validation

Every external input must be validated.

Examples:

```javascript
req.body
req.params
req.query
```

Use Zod.

Do not assume the frontend sends correct values.

---

# 22. Service Input

Services should receive clear structured data.

Example:

```javascript
attendanceService.createSession({
  subjectOfferingId,
  sessionDate,
  period,
  facultyUserId
});
```

Avoid passing the entire Express `req` object into services.

Bad:

```javascript
attendanceService.createSession(req);
```

---

# 23. Date Handling

Use ISO date formats.

API:

```text
2026-09-24
```

Timestamp:

```text
2026-09-24T12:30:00Z
```

Do not pass arbitrary formatted dates such as:

```text
24/09/26
```

through APIs.

---

# 24. Database Naming

Use snake_case for PostgreSQL database fields if Prisma maps to them.

Example:

```text
student_number
created_at
updated_at
subject_offering_id
```

JavaScript uses camelCase:

```javascript
studentNumber
createdAt
subjectOfferingId
```

Prisma maps between the two.

---

# 25. Enum Values

Use stable uppercase enum values.

Example:

```text
ADMIN
FACULTY
STUDENT

DRAFT
SUBMITTED

UNMARKED
PRESENT
ABSENT
LATE

PENDING
APPROVED
REJECTED
```

Avoid values such as:

```text
"presentStudent"
"Present"
"Present_Status"
```

---

# 26. No Magic Numbers

Bad:

```javascript
if (attendance < 75) {}
```

Good:

```javascript
const DEFAULT_ATTENDANCE_THRESHOLD = 75;
```

Better if configurable:

```javascript
const threshold = config.attendanceThreshold;
```

---

# 27. No Magic Strings

Avoid repeated role strings throughout the codebase.

Prefer:

```javascript
export const ROLES = Object.freeze({
  ADMIN: "ADMIN",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT"
});
```

Likewise for statuses where useful.

---

# 28. Comments

Comments should explain **why**, not obvious **what**.

Bad:

```javascript
// Find student
const student = await prisma.student.findUnique(...);
```

Good:

```javascript
// Submitted attendance is immutable; corrections must go through the
// approval workflow to preserve the audit trail.
```

---

# 29. No Dead Code

Do not leave:

```javascript
// TODO maybe implement this later
```

throughout the codebase unless the TODO is genuinely actionable.

Remove unused:

- Imports
- Functions
- Variables
- Routes
- Dependencies

---

# 30. Dependency Discipline

Before adding a package, ask:

1. Is it actually required?
2. Does Node/Express/Prisma already provide the capability?
3. Does it introduce unnecessary complexity?
4. Is it actively maintained?

Avoid dependency sprawl.

---

# 31. Environment Variables

Never hardcode:

```text
DATABASE_URL
JWT_SECRET
API keys
credentials
```

Use `.env`.

Commit:

```text
.env.example
```

Never commit:

```text
.env
```

---

# 32. Logging

Never log:

```text
JWT token
password
database URL
JWT secret
```

Avoid logging unnecessary student personal information.

---

# 33. Async/Await

Use async/await consistently.

Preferred:

```javascript
const student = await studentService.getById(id);
```

Avoid unnecessary promise chaining:

```javascript
studentService
  .getById(id)
  .then(...)
  .catch(...);
```

---

# 34. Error Propagation

Controllers should pass errors to middleware:

```javascript
catch (error) {
  next(error);
}
```

Do not duplicate error response formatting in every controller.

---

# 35. API Route Naming

Use plural nouns.

Good:

```text
/students
/faculty
/subjects
/attendance/sessions
/corrections
```

Avoid:

```text
/getStudents
/createStudent
/doAttendance
```

HTTP method expresses the action.

---

# 36. Business Operations

For meaningful state transitions, use explicit action endpoints where appropriate.

Example:

```text
POST /attendance/sessions/:id/submit
POST /corrections/:id/approve
POST /corrections/:id/reject
```

These are clearer than exposing arbitrary status updates.

---

# 37. Git Commit Style

Use:

```text
feat:
fix:
refactor:
test:
docs:
chore:
```

Examples:

```text
feat: add attendance session creation
feat: add JWT authentication
test: add faculty ownership tests
fix: prevent duplicate attendance sessions
docs: update API contract
```

---

# 38. Testing Standards

Every major business workflow should have tests.

Priority:

```text
Authentication
RBAC
Resource ownership
Attendance submission
Attendance locking
Corrections
Attendance calculations
```

Tests should verify behavior, not implementation details.

---

# 39. Definition of Clean Code

Code is considered clean when:

- Another developer can understand it quickly
- Business rules are obvious
- Functions are reasonably small
- Errors are predictable
- Database access is efficient
- Security checks are explicit
- No unnecessary abstractions exist
- Tests cover important behavior

---

# 40. Core Principle

> Prefer boring, explicit, maintainable code over clever code.

This is an academic assignment that should demonstrate production thinking, not architectural complexity for its own sake.