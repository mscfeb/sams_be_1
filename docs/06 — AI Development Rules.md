# Smart Attendance Management System
## AI-Assisted Development Rules

**Version:** 1.0  
**Purpose:** Control AI-assisted/vibe coding during development

---

# 1. Purpose

This project is being developed with significant AI assistance.

AI is treated as a development tool and coding assistant, not as the authority on product requirements or architecture.

The authoritative sources are:

```text
01_ERD.md
02_API_CONTRACT.md
03_MVP_REQUIREMENTS.md
04_BACKEND_ARCHITECTURE.md
05_CODING_STANDARDS.md
06_AI_DEVELOPMENT_RULES.md
07_IMPLEMENTATION_PLAN.md
```

If generated code conflicts with these documents, the documentation wins.

---

# 2. Core Rule

> AI must not invent business requirements.

If the implementation requires a decision that is not covered by the existing specifications:

1. Identify the ambiguity.
2. Propose the smallest reasonable solution.
3. Document the assumption.
4. Do not silently introduce a new business rule.

---

# 3. Read Before Coding

Before modifying the project, the AI must inspect:

- Existing folder structure
- Relevant source files
- Prisma schema
- Relevant API contract
- Relevant requirements
- Existing tests

Do not blindly overwrite existing implementation.

---

# 4. Database Changes

AI must not introduce a new entity without considering the ERD.

If a database model changes:

```text
Update ERD
        ↓
Update Prisma schema
        ↓
Create migration
        ↓
Update seed data
        ↓
Update affected services
        ↓
Update API contract if necessary
```

Never silently change the database design.

---

# 5. API Changes

If a new endpoint is required:

1. Identify why it is required.
2. Verify it does not duplicate an existing endpoint.
3. Update `02_API_CONTRACT.md`.
4. Implement the endpoint.
5. Add validation.
6. Add authorization.
7. Test it.

Do not randomly create endpoints during implementation.

---

# 6. Business Rules

Business rules belong to the backend.

AI must never rely exclusively on React for:

- Role permissions
- Attendance locking
- Faculty ownership
- Student ownership
- Correction authorization
- Enrollment validation
- Duplicate prevention

---

# 7. Security Rule

Never implement security as:

```text
"If the frontend hides the button, the user cannot do it."
```

The backend must enforce authorization.

---

# 8. Authentication

The project currently uses demo role authentication.

Do not introduce:

- Password authentication
- OAuth
- Google login
- OTP
- SSO

unless explicitly requested.

The JWT architecture should still be implemented correctly.

---

# 9. Authorization

Every protected endpoint must answer:

```text
1. Is the user authenticated?
2. Is the user's role allowed?
3. Does the user have access to this specific resource?
```

Do not stop at role checking.

---

# 10. Client-Supplied Identity

Never trust:

```text
facultyId
studentId
createdBy
requestedBy
markedBy
reviewedBy
```

when the value should come from the authenticated JWT.

Use:

```javascript
req.user.id
```

where appropriate.

---

# 11. Database Integrity

AI must not implement duplicate-prevention only in JavaScript.

Important constraints belong in PostgreSQL/Prisma.

Examples:

```text
Unique student number
Unique employee number
Unique enrollment
Unique attendance record
Unique attendance session
```

---

# 12. Transaction Rule

Whenever an operation modifies multiple related records and those records must remain consistent, use a database transaction.

Examples:

```text
Create attendance session
Approve correction
Reject correction
```

Do not create partial states.

---

# 13. Attendance Rules

The following rules are non-negotiable:

```text
A student can have one attendance record per session.

A session can be submitted only once.

UNMARKED records prevent submission.

Submitted attendance cannot be directly edited.

Corrections require a reason.

Only Admin can approve corrections.

Approved corrections must create an audit record.
```

---

# 14. Do Not Over-Engineer

Do not introduce:

```text
Microservices
Redis
Kafka
RabbitMQ
Kubernetes
GraphQL
Event sourcing
CQRS
WebSockets
AI services
```

unless a clear requirement appears.

The MVP is a modular monolith.

---

# 15. Dependency Rule

AI must not add packages simply because they are popular.

Before adding a dependency, explain:

```text
Why is it required?
What problem does it solve?
Could existing dependencies solve it?
```

Prefer fewer dependencies.

---

# 16. Code Generation Strategy

Do not ask the AI to generate the entire backend in one response.

Build incrementally.

Preferred:

```text
Foundation
    ↓
Database
    ↓
Authentication
    ↓
RBAC
    ↓
Academic modules
    ↓
Attendance
    ↓
Corrections
    ↓
Reports
```

Each phase should compile/run before moving forward.

---

# 17. Small Changes

Prefer focused implementation tasks.

Good prompt:

```text
Implement the Department module according to the existing
ERD and API contract. Do not modify other modules.
Add validation and tests.
```

Bad prompt:

```text
Build the entire backend.
```

---

# 18. Inspect Before Modifying

Before changing an existing file, AI should understand:

- What imports it?
- What it imports?
- What routes depend on it?
- What tests depend on it?
- What business rules it implements?

Avoid breaking unrelated functionality.

---

# 19. Do Not Hide Errors

AI must not solve errors by:

```text
Removing validation
Ignoring exceptions
Using empty catch blocks
Disabling lint rules
Disabling tests
Using `--force`
```

If a test fails, understand the reason.

---

# 20. No Fake Implementations

Do not generate placeholder implementations such as:

```javascript
return [];
```

for an endpoint that is expected to work.

Do not return:

```javascript
{ success: true }
```

without performing the requested operation.

If functionality is intentionally incomplete, mark it clearly.

---

# 21. No Fake Security

Do not implement:

```javascript
if (role === "ADMIN") {
  // assume trusted
}
```

without JWT verification.

Do not accept arbitrary user IDs from the client where the identity can be derived from authentication.

---

# 22. Testing AI-Generated Code

AI-generated code must be validated.

Validation can include:

```text
Lint
Type/structure checking where applicable
Unit tests
Integration tests
API testing
Database inspection
Manual workflow testing
```

The developer must understand what the code does before considering it complete.

---

# 23. Generated Code Review

For meaningful AI-generated changes, review:

```text
Correctness
Security
Database queries
Authorization
Error handling
Transactions
Performance
Maintainability
```

Do not accept code simply because it runs.

---

# 24. API Verification

After implementing an endpoint, verify:

### Happy path

```text
Valid request → expected response
```

### Authentication failure

```text
No JWT → 401
```

### Authorization failure

```text
Wrong role → 403
```

### Resource ownership failure

```text
Wrong faculty/student → 403
```

### Validation failure

```text
Invalid request → 422
```

### Business conflict

```text
Duplicate/locked resource → 409
```

---

# 25. Database Verification

After schema changes:

```text
Run migration
Inspect generated schema
Run seed
Verify foreign keys
Verify unique constraints
Test duplicate scenarios
```

---

# 26. AI Should Explain Significant Decisions

For non-trivial changes, the AI should briefly explain:

```text
What changed
Why it changed
What files changed
How it was validated
```

This makes the development process auditable.

---

# 27. Avoid Documentation Drift

If implementation changes a documented behavior, update the documentation in the same development task.

Never knowingly leave:

```text
API documentation ≠ actual API
```

or:

```text
ERD ≠ actual database
```

---

# 28. AI Usage Reporting

All significant AI-assisted development should be recorded in:

```text
AI_USAGE_REPORT.md
```

Record:

```text
Date
Task
AI Tool
Prompt/Purpose
AI Contribution
Developer Changes
Validation Method
Result
```

---

# 29. Human Responsibility

The developer remains responsible for:

- Architecture
- Requirements
- Security
- Database correctness
- Testing
- Final code
- Assignment submission

AI output is not automatically correct.

---

# 30. Golden Rule

> AI writes code. The developer owns the design, validation, and final result.