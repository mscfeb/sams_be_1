# Smart Attendance Management System
## Implementation Plan

**Version:** 1.0  
**Strategy:** Backend-first, API-first, frontend-second

---

# 1. Objective

Build the Smart Attendance Management System incrementally using:

```text
Backend:
Node.js
Express
JavaScript
Prisma

Database:
PostgreSQL

Authentication:
JWT

Authorization:
RBAC + Resource Ownership

Validation:
Zod

Frontend:
React + JavaScript
```

The development process prioritizes:

```text
Database correctness
        ↓
Backend correctness
        ↓
Security
        ↓
API reliability
        ↓
Frontend integration
        ↓
UI polish
```

---

# 2. Development Strategy

Do not develop the frontend and backend simultaneously at the beginning.

First establish:

```text
PostgreSQL
   ↓
Prisma
   ↓
Express
   ↓
JWT
   ↓
RBAC
   ↓
Business APIs
```

Then build React against stable APIs.

---

# 3. Phase 0 — Repository Setup

## Tasks

- [ ] Create Git repository
- [ ] Create root directory
- [ ] Create `backend/`
- [ ] Create `frontend/`
- [ ] Create `docs/`
- [ ] Add existing specification documents
- [ ] Add `AGENTS.md`
- [ ] Add `.gitignore`
- [ ] Add `README.md`
- [ ] Add `AI_USAGE_REPORT.md`

Expected structure:

```text
attendance-management/
├── AGENTS.md
├── docs/
├── backend/
├── frontend/
├── AI_USAGE_REPORT.md
├── README.md
└── .gitignore
```

---

# 4. Phase 1 — Backend Foundation

## Objective

Create a working Express application before adding business functionality.

## Tasks

- [ ] Initialize Node project
- [ ] Configure ES Modules
- [ ] Install Express
- [ ] Install Prisma
- [ ] Install Zod
- [ ] Install JWT library
- [ ] Install Helmet
- [ ] Install CORS
- [ ] Configure environment variables
- [ ] Create Express app
- [ ] Create server entry point
- [ ] Create health endpoint
- [ ] Create error middleware
- [ ] Create not-found middleware
- [ ] Configure basic logging

Expected endpoint:

```text
GET /health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

# 5. Phase 2 — PostgreSQL + Prisma

## Objective

Create the complete relational database foundation.

## Tasks

- [ ] Configure PostgreSQL
- [ ] Configure `DATABASE_URL`
- [ ] Create Prisma schema
- [ ] Create enums
- [ ] Create relationships
- [ ] Add foreign keys
- [ ] Add unique constraints
- [ ] Add indexes
- [ ] Create initial migration
- [ ] Verify migration
- [ ] Create seed script

Models:

```text
User
Department
AcademicYear
Section
Student
Faculty
Subject
SubjectOffering
Enrollment
AttendanceSession
AttendanceRecord
CorrectionRequest
AuditLog
```

---

# 6. Phase 3 — Seed Data

## Objective

Create realistic development data.

Minimum:

```text
1 Admin
5–10 Faculty
50–100 Students

3 Departments

3–5 Sections

10 Subjects

Multiple SubjectOfferings

Student Enrollments

Attendance Sessions

Attendance Records
```

Seed data should allow:

```text
Admin dashboard
Faculty dashboard
Student dashboard
Low attendance
Correction workflow
```

to be demonstrated.

---

# 7. Phase 4 — Authentication

## Objective

Implement JWT-based demo authentication.

## Tasks

- [ ] Create demo login endpoint
- [ ] Select seeded user based on role
- [ ] Generate JWT
- [ ] Implement token verification
- [ ] Implement `req.user`
- [ ] Implement `/auth/me`

Endpoint:

```text
POST /api/v1/auth/demo-login
```

Roles:

```text
ADMIN
FACULTY
STUDENT
```

---

# 8. Phase 5 — RBAC

## Objective

Secure API endpoints.

## Tasks

- [ ] Create `requireRole()` middleware
- [ ] Protect Admin routes
- [ ] Protect Faculty routes
- [ ] Protect Student routes
- [ ] Test unauthorized access
- [ ] Test missing token
- [ ] Test invalid token

Expected:

```text
No JWT
→ 401

Valid JWT + wrong role
→ 403
```

---

# 9. Phase 6 — Resource Authorization

## Objective

Prevent users from accessing another user's resources.

## Faculty

Faculty can only access:

```text
Their SubjectOfferings
Their AttendanceSessions
Their AttendanceRecords
Their CorrectionRequests
```

## Student

Student can only access:

```text
Their own attendance
Their own history
```

## Tasks

- [ ] Implement faculty ownership checks
- [ ] Implement student ownership checks
- [ ] Add negative tests

---

# 10. Phase 7 — Academic Administration

Implement modules in this order:

```text
Department
     ↓
AcademicYear
     ↓
Section
     ↓
Student
     ↓
Faculty
     ↓
Subject
     ↓
SubjectOffering
     ↓
Enrollment
```

Each module:

```text
[ ] Validation
[ ] Routes
[ ] Controller
[ ] Service
[ ] Authorization
[ ] Database operations
[ ] Error handling
[ ] Tests
```

---

# 11. Phase 8 — Attendance Session

This is the core business feature.

## Create Session

```text
Faculty
   ↓
SubjectOffering
   ↓
Date
   ↓
Period
   ↓
AttendanceSession
```

System automatically creates records for active enrolled students.

Initial status:

```text
UNMARKED
```

---

# 12. Phase 9 — Attendance Marking

## Tasks

- [ ] Retrieve session
- [ ] Retrieve records
- [ ] Update individual record
- [ ] Validate status
- [ ] Ensure faculty ownership
- [ ] Ensure session is DRAFT
- [ ] Prevent duplicate records

Statuses:

```text
UNMARKED
PRESENT
ABSENT
LATE
```

---

# 13. Phase 10 — Attendance Submission

Endpoint:

```text
POST /attendance/sessions/:id/submit
```

Validation:

```text
Session exists
Faculty owns session
Session is DRAFT
All students have been marked
```

Then:

```text
DRAFT
   ↓
SUBMITTED
```

Set:

```text
submitted_at
```

After this:

```text
Direct record modification = forbidden
```

---

# 14. Phase 11 — Attendance Calculation

Implement server-side calculations.

For each subject:

```text
Total submitted sessions
Present count
Late count
Absent count
Attendance percentage
```

Formula:

```text
(PRESENT + LATE)
/
TOTAL SUBMITTED SESSIONS
× 100
```

---

# 15. Phase 12 — Student Attendance

Implement:

```text
GET /students/me/attendance
GET /students/me/attendance/history
```

Student sees:

```text
Overall attendance
Subject attendance
Conducted sessions
Attended sessions
History
```

Student cannot modify anything.

---

# 16. Phase 13 — Low Attendance

Implement:

```text
GET /reports/low-attendance
```

Default threshold:

```text
75%
```

Support filters:

```text
department
section
subject offering
threshold
```

Use database aggregation.

---

# 17. Phase 14 — Corrections

Implement:

```text
POST /corrections
GET /corrections
POST /corrections/:id/approve
POST /corrections/:id/reject
```

Workflow:

```text
Faculty
   ↓
Correction Request
   ↓
PENDING
   ↓
Admin
   ├── APPROVE
   └── REJECT
```

---

# 18. Phase 15 — Audit Logging

For approved/rejected corrections:

```text
AttendanceRecord
        ↓
CorrectionRequest
        ↓
AuditLog
```

Audit should capture:

```text
user
action
entity
entity ID
old value
new value
timestamp
```

---

# 19. Phase 16 — Dashboard APIs

Implement:

```text
GET /dashboard/admin
GET /dashboard/faculty
GET /dashboard/student
```

Keep dashboard queries efficient.

Do not fetch the entire database to create dashboard summaries.

---

# 20. Phase 17 — Backend Testing

Testing priority:

### Authentication

```text
[ ] Demo login
[ ] Invalid role
[ ] Valid JWT
[ ] Invalid JWT
[ ] Missing JWT
```

### RBAC

```text
[ ] Admin access
[ ] Faculty restrictions
[ ] Student restrictions
```

### Ownership

```text
[ ] Faculty A cannot access Faculty B data
[ ] Student A cannot access Student B data
```

### Attendance

```text
[ ] Create session
[ ] Duplicate session rejected
[ ] Records created
[ ] Update record
[ ] UNMARKED prevents submission
[ ] Submission succeeds
[ ] Submitted session locked
```

### Corrections

```text
[ ] Create request
[ ] Duplicate pending correction rejected
[ ] Approve
[ ] Reject
[ ] Cannot review twice
[ ] Audit created
```

---

# 21. Phase 18 — API Review

Before frontend development:

- [ ] Verify all API contracts
- [ ] Verify status codes
- [ ] Verify error responses
- [ ] Verify pagination
- [ ] Verify authorization
- [ ] Verify database transactions
- [ ] Verify no accidental information leakage

At this point the backend should be usable independently of React.

---

# 22. Phase 19 — React Foundation

Only now start the frontend.

## Tasks

- [ ] Initialize React/Vite
- [ ] Configure React Router
- [ ] Configure Axios
- [ ] Create authentication context
- [ ] Create API client
- [ ] Create protected routes
- [ ] Create role-based routing
- [ ] Create basic layout

No major UI polish yet.

---

# 23. Phase 20 — Role Selection

Create:

```text
/login
```

UI:

```text
Choose role:

[ Admin ]
[ Faculty ]
[ Student ]
```

Clicking a role:

```text
POST /auth/demo-login
```

Store authentication state.

Then redirect based on role.

---

# 24. Phase 21 — Admin UI

Build:

```text
/admin
/admin/students
/admin/faculty
/admin/departments
/admin/sections
/admin/subjects
/admin/offerings
/admin/corrections
```

Focus on:

```text
Forms
Tables
Filters
Actions
Error states
Loading states
```

---

# 25. Phase 22 — Faculty UI

Build:

```text
/faculty
/faculty/subjects
/faculty/attendance
/faculty/attendance/:id
```

Primary workflow:

```text
Dashboard
   ↓
Select Subject
   ↓
Create Session
   ↓
Mark Attendance
   ↓
Submit
```

This workflow must be fast.

---

# 26. Phase 23 — Student UI

Build:

```text
/student
/student/attendance
/student/history
```

Display:

```text
Overall %
Subject %
Low attendance
History
```

---

# 27. Phase 24 — Frontend Error Handling

Handle:

```text
401
403
404
409
422
500
```

Example:

```text
401 → redirect to login

403 → show permission message

409 → show business conflict

422 → show validation errors
```

---

# 28. Phase 25 — End-to-End Golden Path

Run this exact workflow:

```text
Admin login
    ↓
Create academic structure
    ↓
Assign faculty
    ↓
Enroll students
    ↓
Faculty login
    ↓
Create attendance
    ↓
Mark students
    ↓
Submit attendance
    ↓
Student login
    ↓
View attendance
    ↓
Identify low attendance
    ↓
Faculty requests correction
    ↓
Admin approves
    ↓
Student sees corrected attendance
```

This is the primary assignment demonstration.

---

# 29. Phase 26 — Security Review

Review:

```text
[ ] JWT verification
[ ] Role enforcement
[ ] Resource ownership
[ ] No client-trusted identity
[ ] Input validation
[ ] CORS
[ ] Helmet
[ ] Secrets in environment variables
[ ] No secrets in Git
[ ] Error responses don't expose internals
```

---

# 30. Phase 27 — Database Review

Check:

```text
[ ] Foreign keys
[ ] Unique constraints
[ ] Indexes
[ ] Transaction boundaries
[ ] Duplicate prevention
[ ] Historical record protection
[ ] Query performance
```

---

# 31. Phase 28 — Performance Review

Check:

```text
[ ] Pagination
[ ] No N+1 queries
[ ] Efficient attendance queries
[ ] Database aggregation for reports
[ ] Appropriate indexes
[ ] Prisma connection reuse
```

The expected scale:

```text
5,000 students
200 faculty
```

does not require distributed architecture.

---

# 32. Phase 29 — Documentation

Complete:

```text
README.md
docs/01_ERD.md
docs/02_API_CONTRACT.md
docs/03_MVP_REQUIREMENTS.md
docs/04_BACKEND_ARCHITECTURE.md
docs/05_CODING_STANDARDS.md
docs/06_AI_DEVELOPMENT_RULES.md
docs/07_IMPLEMENTATION_PLAN.md
AI_USAGE_REPORT.md
```

---

# 33. Phase 30 — Assignment Demonstration

Prepare a short demonstration showing:

```text
1. Role selection

2. Admin dashboard

3. Academic setup

4. Faculty assignment

5. Attendance creation

6. Attendance marking

7. Attendance submission

8. Student attendance

9. Low attendance

10. Correction request

11. Admin approval

12. Updated attendance

13. Audit trail
```

---

# 34. Definition of Complete

The MVP is complete when:

```text
Database works
        +
Backend works independently
        +
Authentication works
        +
RBAC works
        +
Attendance workflow works
        +
Corrections work
        +
Reports work
        +
React consumes the APIs
        +
Golden path works
        +
Security review passes
        +
Documentation complete
```

---

# 35. Development Rule

Do not move to the next phase merely because code was generated.

Move forward when the current phase is:

```text
Implemented
+
Tested
+
Validated
+
Documented
```

---

# 36. Priority if Time Becomes Limited

Priority order:

```text
P0
Database
Authentication
Authorization
Attendance workflow

P1
History
Corrections
Low attendance

P2
Admin CRUD
Reports
Dashboards

P3
UI polish
Additional filters
Export
Extra convenience features
```

A working P0 system is more valuable than a beautiful incomplete system.

---

# 37. Final Development Philosophy

The project should be developed as though a small engineering team is delivering an internal production MVP.

That means:

```text
Understand
   ↓
Design
   ↓
Implement
   ↓
Test
   ↓
Review
   ↓
Integrate
   ↓
Validate
```

not:

```text
Prompt AI
   ↓
Copy code
   ↓
Hope it works
```

The goal is not maximum code generation.

The goal is a **small, correct, secure, explainable system**.