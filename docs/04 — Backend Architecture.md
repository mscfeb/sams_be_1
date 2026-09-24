# Smart Attendance Management System
## Backend Architecture

**Version:** 1.0  
**Status:** Implementation Baseline  
**Runtime:** Node.js  
**Language:** JavaScript  
**Framework:** Express  
**Database:** PostgreSQL  
**ORM:** Prisma

---

# 1. Purpose

This document defines the technical architecture and implementation boundaries for the backend of the Smart Attendance Management System.

The backend will be implemented as a **modular monolith**.

The goal is to build a backend that is:

- Simple
- Fast
- Secure
- Maintainable
- Easy to test
- Easy to explain
- Appropriate for approximately 5,000 students and 200 faculty
- Easy to extend after the assignment

The project intentionally avoids unnecessary distributed-system complexity.

---

# 2. Architecture Style

The application uses a modular monolith architecture.

```text
Client
  |
  | HTTP / JSON
  v
Express Application
  |
  +--> Middleware
  |
  +--> Routes
  |
  +--> Controllers
  |
  +--> Services
  |
  +--> Prisma
  |
  v
PostgreSQL
```

The backend is deployed as one application.

There are no microservices.

---

# 3. Request Lifecycle

Every protected request should follow this general flow:

```text
HTTP Request
     |
     v
Express
     |
     v
Global Middleware
     |
     +--> Security
     +--> CORS
     +--> JSON parsing
     +--> Request logging
     |
     v
Route
     |
     v
Validation Middleware
     |
     v
Authentication Middleware
     |
     v
Authorization Middleware
     |
     v
Controller
     |
     v
Service
     |
     v
Prisma
     |
     v
PostgreSQL
     |
     v
Service
     |
     v
Controller
     |
     v
API Response
```

Not every endpoint requires authentication or authorization.

---

# 4. Layer Responsibilities

## 4.1 Routes

Routes define:

- HTTP method
- URL
- Middleware
- Controller handler

Routes should not contain business logic.

Example:

```javascript
router.post(
  "/sessions",
  authenticate,
  requireRole("FACULTY"),
  validate(createSessionSchema),
  attendanceController.createSession
);
```

---

# 5. Controllers

Controllers are responsible for HTTP concerns.

A controller should:

1. Read request data
2. Call the service
3. Return the response

Example:

```javascript
async function createSession(req, res, next) {
  try {
    const result = await attendanceService.createSession({
      ...req.body,
      userId: req.user.id
    });

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
```

Controllers should not contain:

- Complex business logic
- Prisma queries
- Authorization decisions beyond middleware
- Attendance calculations
- Transaction orchestration

---

# 6. Services

Services contain business logic.

Examples:

```text
attendance.service.js
correction.service.js
student.service.js
subject-offering.service.js
```

The service layer is responsible for:

- Business rules
- Resource ownership checks
- Transaction coordination
- Domain calculations
- Calling Prisma/database operations

Example:

```javascript
async function submitSession(sessionId, facultyId) {
  // Verify ownership
  // Verify DRAFT state
  // Verify all students marked
  // Update session
}
```

---

# 7. Database Access

Prisma is the primary database access layer.

A shared Prisma client should be used.

```text
src/lib/prisma.js
```

Example:

```javascript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
```

The application should not create a new PrismaClient instance for every request.

---

# 8. Repository Pattern

Repositories are **not mandatory for every module**.

We will not create abstractions merely for architectural appearance.

For simple modules:

```text
Controller
   ↓
Service
   ↓
Prisma
```

is acceptable.

A repository can be introduced when:

- Database access becomes complex
- Queries are reused
- Testing benefits from isolation
- A module contains substantial query logic

Example:

```text
attendance.service.js
        ↓
attendance.repository.js
        ↓
Prisma
```

The goal is maintainability, not maximum abstraction.

---

# 9. Module Architecture

Business domains are separated into modules.

```text
src/modules/

auth/
departments/
academic-years/
sections/
students/
faculty/
subjects/
subject-offerings/
enrollments/
attendance/
corrections/
reports/
dashboard/
audit/
```

Each module should contain only what it needs.

Typical structure:

```text
attendance/
├── attendance.routes.js
├── attendance.controller.js
├── attendance.service.js
└── attendance.validation.js
```

A repository is added only when useful.

---

# 10. Authentication Architecture

The assignment uses simplified demo authentication.

The flow is:

```text
Role Selection
      |
      v
POST /api/v1/auth/demo-login
      |
      v
Backend selects seeded demo user
      |
      v
JWT generated
      |
      v
Client receives token
```

The token contains:

```json
{
  "sub": "user-id",
  "role": "FACULTY"
}
```

The backend verifies this token for protected requests.

---

# 11. JWT Rules

JWT secrets must never be hardcoded.

Environment variables:

```text
JWT_SECRET
JWT_EXPIRES_IN
```

Example:

```text
JWT_EXPIRES_IN=1h
```

JWT should contain only the minimum information required for authentication and authorization.

Do not store:

```text
student name
department
attendance percentage
```

inside the token.

---

# 12. Authentication Middleware

Authentication middleware should:

1. Read Authorization header
2. Validate Bearer format
3. Verify JWT
4. Extract user ID and role
5. Attach authenticated user information to `req.user`

Example:

```javascript
req.user = {
  id: decoded.sub,
  role: decoded.role
};
```

If authentication fails:

```text
401 UNAUTHORIZED
```

---

# 13. RBAC Architecture

Role-based access is enforced on the backend.

Example:

```javascript
requireRole("ADMIN")
```

Multiple roles:

```javascript
requireRole("ADMIN", "FACULTY")
```

RBAC answers:

> Is this type of user allowed to access this operation?

---

# 14. Resource Authorization

RBAC alone is insufficient.

Example:

```text
Faculty A
```

should not be able to access:

```text
Faculty B's attendance session
```

even though both have:

```text
role = FACULTY
```

Therefore the service layer must perform ownership checks.

Example:

```text
Faculty
  |
  v
SubjectOffering
  |
  v
AttendanceSession
```

The service verifies that the authenticated faculty owns the offering associated with the session.

---

# 15. Authorization Rule

Never trust client-supplied identity fields when the identity can be derived from the JWT.

Bad:

```json
{
  "facultyId": "some-id"
}
```

and then trusting it.

Good:

```javascript
const facultyId = req.user.id;
```

Similarly:

```text
requestedBy
createdBy
markedBy
reviewedBy
```

should be derived from authenticated identity.

---

# 16. Validation

Zod is used to validate external input.

Validation occurs before the controller.

Example:

```javascript
const createDepartmentSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(100)
});
```

Validation covers:

- Request body
- Query parameters
- Route parameters

Business validation remains in services.

---

# 17. Validation vs Business Rules

Schema validation:

```text
Is semester an integer?
Is UUID valid?
Is status a valid enum?
Is name present?
```

Business validation:

```text
Does the subject exist?
Does the faculty own the offering?
Is the attendance session already submitted?
Is the student enrolled?
```

These responsibilities must remain separate.

---

# 18. Error Architecture

Use centralized error handling.

Application errors should contain:

```text
statusCode
code
message
details (optional)
```

Example:

```javascript
throw new AppError(
  409,
  "ATTENDANCE_SESSION_LOCKED",
  "Attendance has already been submitted."
);
```

The global error middleware converts errors into the standard API response.

---

# 19. Error Response

All errors should follow:

```json
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_SESSION_LOCKED",
    "message": "Attendance has already been submitted."
  }
}
```

Validation errors may contain:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "fields": {
      "semester": "Expected an integer."
    }
  }
}
```

Do not expose:

- Stack traces
- Database credentials
- SQL queries
- Internal implementation details

in production responses.

---

# 20. Transaction Architecture

Transactions are mandatory for operations that change multiple related records.

## Create Attendance Session

```text
BEGIN

Create session

Create attendance records

COMMIT
```

If record creation fails:

```text
ROLLBACK
```

---

## Approve Correction

```text
BEGIN

Update attendance record

Update correction request

Create audit log

COMMIT
```

Any failure:

```text
ROLLBACK
```

Prisma transactions should be used.

---

# 21. Attendance State Rules

Attendance session:

```text
DRAFT
SUBMITTED
```

Allowed transitions:

```text
DRAFT → SUBMITTED
```

No reverse transition.

Once submitted:

```text
Attendance records cannot be directly edited.
```

Corrections require the correction workflow.

---

# 22. Attendance Record States

During session creation:

```text
UNMARKED
```

Faculty must explicitly select:

```text
PRESENT
ABSENT
LATE
```

before submission.

Submission is rejected if any record remains:

```text
UNMARKED
```

---

# 23. Database Integrity

The application should rely on PostgreSQL to enforce structural integrity.

Important constraints:

```text
UNIQUE
FOREIGN KEY
NOT NULL
CHECK
```

Examples:

```text
student_number UNIQUE

employee_number UNIQUE

attendance_session_id + student_id UNIQUE
```

Application logic should not be the only protection against duplicate records.

---

# 24. Soft Deactivation

Historical academic records must remain intact.

Where appropriate:

```text
is_active = false
```

should be used instead of physical deletion.

This applies particularly to:

```text
Users
Students
Faculty
```

---

# 25. Reporting Architecture

Reports should use database aggregation where possible.

Bad:

```text
Load thousands of attendance records
into Node.js
then calculate everything in JavaScript.
```

Preferred:

```text
PostgreSQL
    ↓
COUNT
SUM
GROUP BY
JOIN
    ↓
Small result set
    ↓
Node.js
```

This reduces memory usage and network traffic.

---

# 26. Pagination

Large collections must be paginated.

Default:

```text
page = 1
limit = 20
```

Maximum:

```text
limit = 100
```

Never allow an endpoint to return thousands of students by default.

---

# 27. API Versioning

All APIs are under:

```text
/api/v1
```

Example:

```text
/api/v1/students
/api/v1/attendance/sessions
```

Future breaking API changes can use:

```text
/api/v2
```

---

# 28. Security Middleware

The application should use:

```text
helmet
cors
```

CORS should explicitly allow the configured frontend origin.

Do not use unrestricted production configuration such as:

```javascript
origin: "*"
```

for authenticated APIs.

---

# 29. Rate Limiting

Basic rate limiting should be applied particularly to:

```text
/auth/demo-login
```

and later to real authentication endpoints if added.

General API rate limiting can be introduced if needed.

Do not over-engineer this for the assignment.

---

# 30. Logging

Use structured application logging.

Log:

- Server startup
- Request failures
- Important business errors
- Database errors
- Authentication failures where appropriate

Do not log:

- JWT tokens
- Passwords
- Secrets
- Sensitive personal information unnecessarily

---

# 31. Environment Configuration

Configuration must come from environment variables.

Example:

```text
NODE_ENV=development

PORT=5000

DATABASE_URL=postgresql://...

JWT_SECRET=...
JWT_EXPIRES_IN=1h

FRONTEND_URL=http://localhost:5173
```

`.env` must not be committed.

`.env.example` must be committed.

---

# 32. Recommended Backend Structure

```text
backend/
│
├── src/
│   ├── config/
│   │   └── env.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── error.middleware.js
│   │   └── not-found.middleware.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── departments/
│   │   ├── academic-years/
│   │   ├── sections/
│   │   ├── students/
│   │   ├── faculty/
│   │   ├── subjects/
│   │   ├── subject-offerings/
│   │   ├── enrollments/
│   │   ├── attendance/
│   │   ├── corrections/
│   │   ├── reports/
│   │   ├── dashboard/
│   │   └── audit/
│   │
│   ├── lib/
│   │   ├── prisma.js
│   │   └── logger.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── errors.js
│   │   └── response.js
│   │
│   ├── app.js
│   └── server.js
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# 33. Module Example

Attendance module:

```text
attendance/
├── attendance.routes.js
├── attendance.controller.js
├── attendance.service.js
└── attendance.validation.js
```

Responsibilities:

```text
routes
  → URL + middleware

validation
  → request validation

controller
  → HTTP handling

service
  → attendance business logic
```

---

# 34. Frontend Integration

The frontend communicates only through the REST API.

The frontend must not:

- Access PostgreSQL
- Know Prisma
- Calculate authoritative attendance
- Bypass backend authorization
- Modify database state directly

The frontend is a client of the backend.

---

# 35. Architecture Principle

The most important principle is:

> Keep the domain rules on the server and keep the client simple.

The React application should be replaceable without changing the attendance domain.

---

# 36. Architecture Decision Summary

```text
Architecture:
Modular Monolith

Runtime:
Node.js

Language:
JavaScript

Framework:
Express

Database:
PostgreSQL

ORM:
Prisma

Authentication:
JWT

Authorization:
RBAC + Resource Ownership

Validation:
Zod

Security:
Helmet + CORS

Testing:
Unit + Integration

API:
REST / JSON

Frontend:
React

Deployment:
Single backend + PostgreSQL
```