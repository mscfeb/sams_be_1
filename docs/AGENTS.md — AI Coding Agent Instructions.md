# Smart Attendance Management System
## AI Coding Agent Instructions

This repository contains the Smart Attendance Management System MVP.

The project is developed using AI-assisted/vibe coding.

The AI coding agent must follow the engineering rules below.

---

# 1. Source of Truth

Before making changes, read the relevant documentation:

```text
docs/01_ERD.md
docs/02_API_CONTRACT.md
docs/03_MVP_REQUIREMENTS.md
docs/04_BACKEND_ARCHITECTURE.md
docs/05_CODING_STANDARDS.md
docs/06_AI_DEVELOPMENT_RULES.md
docs/07_IMPLEMENTATION_PLAN.md
```

These documents define the agreed architecture and requirements.

Do not invent requirements that are not present in the documentation.

---

# 2. Technology Constraints

Backend:

```text
Node.js
Express
JavaScript
Prisma
PostgreSQL
JWT
Zod
```

Frontend:

```text
React
JavaScript
Vite
React Router
Axios
```

Do not introduce TypeScript.

Do not convert the project to TypeScript.

---

# 3. Architecture

The backend is a modular monolith.

Expected flow:

```text
Route
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

Controllers must remain thin.

Business logic belongs in services.

---

# 4. Database

PostgreSQL is the source of truth.

Prisma is used for database access.

Do not bypass database constraints with application-only assumptions.

Important business invariants must be protected by:

```text
Application validation
+
Database constraints
```

---

# 5. Database Changes

Never silently change the database model.

If a new entity or relationship is required:

1. Explain why.
2. Update the ERD.
3. Update Prisma schema.
4. Create a migration.
5. Update seed data.
6. Update affected API documentation.

---

# 6. API Changes

Do not silently create new APIs.

If an API contract changes:

1. Update API documentation.
2. Implement the change.
3. Add validation.
4. Add authorization.
5. Add tests.

---

# 7. Security

Never trust the frontend.

Backend must enforce:

```text
JWT
 ↓
Authentication
 ↓
RBAC
 ↓
Resource ownership
```

Never trust client-supplied:

```text
role
userId
facultyId
studentId
createdBy
requestedBy
markedBy
reviewedBy
```

when the value can be derived from the authenticated user.

---

# 8. Authentication

The MVP uses demo role authentication.

Allowed roles:

```text
ADMIN
FACULTY
STUDENT
```

Demo login must still issue a real JWT.

Do not implement real credential authentication unless explicitly requested.

---

# 9. Attendance Rules

These rules are mandatory:

```text
A session starts as DRAFT.

Every enrolled student receives an UNMARKED record.

Every student must be explicitly marked.

UNMARKED records prevent submission.

DRAFT sessions can be edited.

SUBMITTED sessions cannot be directly edited.

Corrections require a correction request.

Only Admin can approve corrections.

Approved corrections update attendance and create an audit log.
```

---

# 10. Transactions

Use database transactions for:

```text
Attendance session creation
Correction approval
Correction rejection
```

Never leave partially completed multi-step operations.

---

# 11. Code Quality

Prefer:

```text
Simple
Explicit
Readable
Testable
Maintainable
```

Avoid:

```text
Over-abstraction
Huge functions
Huge files
Clever patterns
Unnecessary dependencies
```

---

# 12. Dependencies

Do not install packages without a clear reason.

Before adding a dependency, verify whether the existing stack already provides the required functionality.

---

# 13. Existing Code

Before modifying existing code:

1. Read the file.
2. Read related files.
3. Understand dependencies.
4. Preserve existing behavior unless intentionally changing it.
5. Run relevant tests after modification.

Do not overwrite working code blindly.

---

# 14. Testing

After meaningful implementation changes, run:

```text
Lint
Tests
Application startup
Relevant API tests
```

For database changes:

```text
Migration
Seed
Relevant database operations
```

---

# 15. Error Handling

Use the project's centralized error handling.

Do not create random error response formats.

Standard:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

# 16. API Responses

Standard success:

```json
{
  "success": true,
  "data": {}
}
```

Collections may include:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

# 17. Performance

Avoid:

```text
N+1 queries
Unbounded list queries
Loading entire tables into Node.js
Repeated database queries inside loops
```

Prefer database aggregation and indexed queries.

---

# 18. Scope Control

Do not add:

```text
Microservices
Redis
Kafka
GraphQL
WebSockets
Kubernetes
AI services
Face recognition
QR attendance
Notifications
```

unless explicitly requested.

---

# 19. Documentation Synchronization

When implementation changes a documented behavior, update the relevant documentation.

Never knowingly leave:

```text
Documentation ≠ Implementation
```

---

# 20. AI Development

AI-generated code must be treated as untrusted until reviewed.

For significant changes:

```text
Generate
 ↓
Inspect
 ↓
Run
 ↓
Test
 ↓
Validate
```

Do not assume generated code is correct merely because it compiles or starts.

---

# 21. Prompt Scope

Prefer focused implementation tasks.

Good:

```text
Implement the attendance session creation endpoint
according to the existing API contract.
Do not modify unrelated modules.
Add validation and tests.
```

Avoid:

```text
Build the entire application.
```

---

# 22. Final Rule

> Do not optimize for generating the most code. Optimize for generating the smallest amount of correct, secure, maintainable code that satisfies the specification.