# Smart Attendance Management System
## MVP Requirements

**Version:** 1.0  
**Status:** Implementation Baseline

---

# 1. Product Objective

Build a simple, reliable attendance management system for a college with approximately:

```text
5,000 students
200 faculty
Multiple departments
Multiple sections
Multiple subjects
```

The MVP focuses on:

- Correct attendance recording
- Attendance history
- Controlled corrections
- Role-based authorization
- Low-attendance identification
- Relational data integrity
- Fast and simple workflows

The system intentionally prioritizes backend correctness, security, database design, and maintainability over visual polish.

---

# 2. MVP User Roles

## Admin

Institution-level management.

Can:

- Manage departments
- Manage academic years
- Manage sections
- Manage students
- Manage faculty
- Manage subjects
- Assign subject offerings
- Manage enrollments
- View attendance
- Review corrections
- View reports

---

## Faculty

Academic attendance management.

Can:

- View assigned subjects
- View assigned sections
- Create attendance sessions
- Mark attendance
- Save attendance as draft
- Submit attendance
- View attendance history
- Request attendance corrections
- View low-attendance students in assigned offerings

---

## Student

Attendance consumer.

Can:

- View own dashboard
- View overall attendance
- View subject-wise attendance
- View attendance history
- Identify low-attendance subjects

Students cannot modify attendance.

---

# 3. Authentication Scope

The assignment MVP does not require real username/password authentication.

Instead:

```text
Role Selection
      ↓
Admin / Faculty / Student
      ↓
Demo Login API
      ↓
Backend generates JWT
      ↓
Frontend stores authentication state
      ↓
Protected API requests
```

The backend still implements:

```text
JWT
RBAC
Resource authorization
```

This allows the assignment to demonstrate production-style authorization without spending development time on credential management.

Real authentication can be added later without redesigning the core authorization architecture.

---

# 4. Core User Journeys

## Journey A — Admin Setup

```text
Admin Login
    ↓
Create Department
    ↓
Create Academic Year
    ↓
Create Section
    ↓
Create Students
    ↓
Create Faculty
    ↓
Create Subjects
    ↓
Create Subject Offering
    ↓
Enroll Students
```

This creates the academic structure required for attendance.

---

# 5. Journey B — Faculty Marks Attendance

```text
Faculty Login
    ↓
Faculty Dashboard
    ↓
View Assigned Subject
    ↓
Create Attendance Session
    ↓
System loads enrolled students
    ↓
Faculty marks each student
    ↓
Save Draft
    ↓
Review
    ↓
Submit
```

After submission:

```text
Attendance becomes locked.
```

---

# 6. Journey C — Student Views Attendance

```text
Student Login
    ↓
Student Dashboard
    ↓
Overall Attendance
    ↓
Subject-wise Attendance
    ↓
Attendance History
```

The student cannot modify attendance.

---

# 7. Journey D — Attendance Correction

```text
Faculty
   ↓
Find submitted attendance
   ↓
Create correction request
   ↓
Provide reason
   ↓
Admin reviews
   ↓
Approve / Reject
```

If approved:

```text
AttendanceRecord updated
       +
CorrectionRequest approved
       +
AuditLog created
```

All three actions occur inside one transaction.

---

# 8. Attendance Lifecycle

Attendance sessions use:

```text
DRAFT
  ↓
SUBMITTED
```

### DRAFT

Faculty can modify attendance.

### SUBMITTED

Attendance is locked.

Changes require a correction request.

This prevents historical attendance from being silently modified.

---

# 9. Attendance Status

For MVP, records use:

```text
UNMARKED
PRESENT
ABSENT
LATE
```

`UNMARKED` exists only while a session is being prepared.

A session cannot be submitted while any student remains `UNMARKED`.

For percentage calculation:

```text
PRESENT = attended
LATE    = attended
ABSENT  = not attended
```

---

# 10. Attendance Calculation

For a subject:

```text
Attendance % =
(PRESENT + LATE)
/
Total Submitted Sessions
× 100
```

Example:

```text
Conducted = 30
Present   = 24
Late      = 2
Absent    = 4

Attendance =
26 / 30 × 100

= 86.67%
```

Percentages are derived rather than stored as authoritative values.

---

# 11. Low Attendance

Default threshold:

```text
75%
```

A student is considered low attendance when:

```text
attendance < threshold
```

The threshold should be configurable.

Example:

```text
Student Attendance: 68%

Status:
LOW ATTENDANCE
```

The system should surface low-attendance students in:

```text
Admin dashboard
Faculty dashboard
Student dashboard
Reports
```

---

# 12. MVP Functional Requirements

## FR-01 Authentication

The system shall allow users to select:

```text
Admin
Faculty
Student
```

and obtain a valid JWT through the demo authentication endpoint.

---

## FR-02 Authorization

The backend shall enforce role-based access.

Example:

```text
Admin → administrative APIs
Faculty → assigned academic/attendance APIs
Student → own attendance APIs
```

---

## FR-03 Department Management

Admin shall be able to:

```text
Create department
List departments
Update department
```

---

## FR-04 Academic Year Management

Admin shall be able to:

```text
Create academic year
List academic years
Set active academic year
```

---

## FR-05 Section Management

Admin shall be able to:

```text
Create section
List sections
Update section
```

---

## FR-06 Student Management

Admin shall be able to:

```text
Create student
View students
Search students
Filter students
Update student
Deactivate student
```

---

## FR-07 Faculty Management

Admin shall be able to:

```text
Create faculty
View faculty
Update faculty
Deactivate faculty
```

---

## FR-08 Subject Management

Admin shall be able to:

```text
Create subject
View subjects
Update subject
```

---

## FR-09 Subject Offering

Admin shall be able to assign:

```text
Subject
Faculty
Section
Academic Year
Semester
```

into a SubjectOffering.

---

## FR-10 Enrollment

Admin shall be able to enroll students into subject offerings.

The system shall prevent duplicate enrollment.

---

## FR-11 Attendance Session Creation

Faculty shall be able to create an attendance session for an assigned SubjectOffering.

The system shall automatically load active enrolled students.

---

## FR-12 Attendance Marking

Faculty shall be able to set:

```text
PRESENT
ABSENT
LATE
```

for each enrolled student.

---

## FR-13 Attendance Draft

Faculty shall be able to save attendance while it is in `DRAFT`.

---

## FR-14 Attendance Submission

Faculty shall be able to submit a completed session.

The system shall reject submission if:

```text
Any record is UNMARKED
```

After submission:

```text
Session = SUBMITTED
```

---

## FR-15 Attendance Locking

Submitted sessions cannot be directly modified.

---

## FR-16 Correction Requests

Faculty shall be able to request changes to submitted attendance.

A reason is mandatory.

---

## FR-17 Correction Review

Admin shall be able to:

```text
View pending corrections
Approve correction
Reject correction
```

---

## FR-18 Audit

Approved/rejected corrections shall create an audit record.

---

## FR-19 Student Attendance

Students shall be able to view:

```text
Overall attendance
Subject attendance
Conducted sessions
Attended sessions
Attendance history
```

---

## FR-20 Low Attendance

The system shall identify students below the configured attendance threshold.

---

## FR-21 Reports

The MVP shall provide:

```text
Student attendance report
Subject attendance report
Low attendance report
```

---

# 13. Non-Functional Requirements

## NFR-01 Security

All protected APIs must require a valid JWT.

---

## NFR-02 Authorization

Authorization must be enforced server-side.

The frontend must never be considered a security boundary.

---

## NFR-03 Data Integrity

The database must enforce:

```text
Foreign keys
Unique constraints
Not-null constraints
Check constraints where appropriate
```

---

## NFR-04 Transaction Safety

Multi-step attendance operations must use database transactions.

---

## NFR-05 Performance

The system should:

- Paginate large lists
- Avoid unnecessary database queries
- Use appropriate indexes
- Avoid N+1 queries
- Use database aggregation for reports

5,000 students is comfortably within PostgreSQL's capabilities with a properly indexed relational design.

---

## NFR-06 Maintainability

Backend should follow:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Repository / ORM
 ↓
Database
```

Business logic should not be placed directly in route handlers.

---

## NFR-07 Validation

All external input must be validated.

Use Zod at the API boundary.

---

## NFR-08 Error Handling

The backend shall provide centralized error handling and consistent API error responses.

---

# 14. Frontend Requirements

The frontend intentionally remains simple.

Technology:

```text
React
TypeScript
Vite
React Router
Axios
```

---

# 15. Frontend Routes

```text
/login

/admin
/admin/students
/admin/faculty
/admin/departments
/admin/sections
/admin/subjects
/admin/offerings
/admin/corrections

/faculty
/faculty/subjects
/faculty/attendance
/faculty/attendance/:id

/student
/student/attendance
/student/history
```

Routes should be protected according to role.

---

# 16. Admin Dashboard

Required information:

```text
Total students
Total faculty
Average attendance
Low-attendance students
Pending correction requests
```

Actions:

```text
Students
Faculty
Departments
Sections
Subjects
Offerings
Corrections
```

No elaborate visualization is required.

---

# 17. Faculty Dashboard

Required:

```text
Assigned subject offerings
Today's classes
Recent attendance sessions
Low-attendance students
```

Primary action:

```text
Mark Attendance
```

The attendance workflow should require minimal clicks.

---

# 18. Student Dashboard

Required:

```text
Overall attendance
Subject-wise attendance
Low-attendance warning
Recent attendance
```

---

# 19. UI Philosophy

The UI should prioritize:

```text
Clarity
Speed
Correctness
Accessibility
Simple navigation
```

Avoid spending significant development time on:

```text
Animations
Complex visualizations
Decorative components
Advanced themes
```

The assignment is primarily evaluated through system functionality and engineering decisions.

---

# 20. Backend Technology

```text
Node.js
Express
TypeScript
Prisma
PostgreSQL
JWT
Zod
Helmet
CORS
bcrypt
```

bcrypt is included for compatibility with future real authentication even though credential login is outside the current MVP.

---

# 21. Backend Structure

```text
server/
│
├── src/
│   ├── config/
│   ├── middleware/
│   ├── modules/
│   │   ├── auth/
│   │   ├── students/
│   │   ├── faculty/
│   │   ├── departments/
│   │   ├── academic-years/
│   │   ├── sections/
│   │   ├── subjects/
│   │   ├── subject-offerings/
│   │   ├── enrollments/
│   │   ├── attendance/
│   │   ├── corrections/
│   │   ├── reports/
│   │   └── dashboard/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── .env
├── .env.example
└── package.json
```

---

# 22. Frontend Structure

```text
client/
│
├── src/
│   ├── api/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── faculty/
│   │   └── student/
│   ├── routes/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
```

---

# 23. Development Sequence

Implementation must proceed in the following order.

## Phase 1 — Repository Setup

```text
Create monorepo/project
Create React app
Create Node/Express app
Configure TypeScript
Configure environment variables
Configure linting/formatting
```

---

## Phase 2 — Database

```text
Install PostgreSQL
Configure Prisma
Create schema
Create migration
Create seed script
Create indexes
```

Seed:

```text
1 Admin
5–10 Faculty
50–100 Students
3 Departments
3–5 Sections
10 Subjects
Subject Offerings
Enrollments
Sample Attendance
```

The data should be sufficient to demonstrate all dashboards.

---

# 24. Phase 3 — Backend Foundation

Implement:

```text
Express application
CORS
Helmet
JSON parsing
Request logging
Error middleware
404 handling
Environment configuration
Prisma connection
```

---

# 25. Phase 4 — JWT + RBAC

Implement:

```text
JWT generation
JWT verification middleware
Current user middleware
Role middleware
Resource ownership checks
```

Demo authentication:

```text
POST /auth/demo-login
```

---

# 26. Phase 5 — Admin APIs

Implement in this order:

```text
Departments
Academic Years
Sections
Students
Faculty
Subjects
Subject Offerings
Enrollments
```

Each module should include:

```text
Route
Validation schema
Controller
Service
Database operations
Error handling
```

---

# 27. Phase 6 — Attendance Engine

Implement:

```text
Create attendance session
Load enrolled students
Mark attendance
Update attendance
Save draft
Submit attendance
View attendance
Attendance calculation
```

This is the core business module.

---

# 28. Phase 7 — Corrections

Implement:

```text
Create correction request
List correction requests
Approve
Reject
Audit log
```

Approval must be transactional.

---

# 29. Phase 8 — Reports

Implement:

```text
Student attendance
Subject attendance
Low attendance
Dashboard summaries
```

Use database aggregation rather than loading all records into Node.js whenever possible.

---

# 30. Phase 9 — API Testing

Before React integration, verify all critical backend workflows.

Minimum tests:

### Authentication

```text
Demo login works.
Invalid role rejected.
JWT is required for protected routes.
```

### RBAC

```text
Admin can access admin endpoints.
Faculty cannot access admin endpoints.
Student cannot access faculty endpoints.
```

### Ownership

```text
Faculty cannot access another faculty's attendance.
Student cannot access another student's attendance.
```

### Attendance

```text
Session can be created.
Enrolled students are loaded.
Attendance can be updated.
UNMARKED records prevent submission.
Submitted sessions are locked.
Duplicate sessions are rejected.
Duplicate records are impossible.
```

### Corrections

```text
Faculty can create request.
Admin can approve.
Admin can reject.
Reviewed correction cannot be reviewed again.
Approval updates attendance.
Approval creates audit log.
```

---

# 31. Phase 10 — React Integration

Only after backend workflows are stable:

```text
Role selection
 ↓
Demo login
 ↓
JWT handling
 ↓
Protected routes
 ↓
Admin dashboard
 ↓
Faculty dashboard
 ↓
Attendance UI
 ↓
Student dashboard
```

---

# 32. Phase 11 — End-to-End Validation

The complete demonstration flow should be:

```text
1. Admin logs in

2. Admin creates/uses academic data

3. Admin assigns:
   Subject → Faculty → Section

4. Admin enrolls students

5. Faculty logs in

6. Faculty sees assigned subject

7. Faculty creates attendance session

8. System loads students

9. Faculty marks:
   Present / Absent / Late

10. Faculty submits

11. Student logs in

12. Student sees updated attendance

13. Student falls below threshold

14. Low attendance is displayed

15. Faculty requests correction

16. Admin approves correction

17. Student attendance updates

18. Audit record exists
```

This is the **golden path** for the demo.

---

# 33. Performance Strategy

The MVP should use:

```text
Database indexes
Pagination
Selective queries
Aggregations
Transactions
Connection pooling
```

Avoid:

```text
Loading all students on every request
Calculating reports by iterating thousands of records in JavaScript
N+1 database queries
Returning unnecessary fields
```

---

# 34. Data Integrity Strategy

Business invariants must be enforced at both appropriate layers.

Application layer:

```text
Faculty owns offering
Student belongs to offering section
Session is editable only while DRAFT
Correction only when SUBMITTED
```

Database layer:

```text
Unique constraints
Foreign keys
Not-null constraints
Check constraints
```

The database should protect against invalid states even if an API bug occurs.

---

# 35. Assumptions

The MVP makes these assumptions:

1. One student has one current section.
2. A student can enroll in multiple subject offerings.
3. A subject offering represents a faculty + subject + section + academic period.
4. A subject can have multiple offerings.
5. Attendance is recorded per class/session.
6. A student has one attendance record per session.
7. `LATE` counts as attended.
8. Submitted attendance cannot be directly edited.
9. Corrections require a reason.
10. Only Admin can approve corrections.
11. Attendance threshold defaults to 75%.
12. Demo authentication replaces real credentials.
13. Attendance is not biometric.
14. One attendance session represents one class period.
15. Physical deletion of historical entities should be avoided.
16. The system operates within one institution for the MVP.
17. Timezone is configured at the application level.
18. Attendance session dates cannot be arbitrarily far in the past/future without explicit business validation.

---

# 36. Out of Scope

The following are intentionally excluded:

```text
Real password authentication
Password reset
Email verification
OTP
SSO
Biometric attendance
Face recognition
QR attendance
Mobile application
Push notifications
Email notifications
SMS
Parent portal
Leave management
Timetable generation
Payroll
Fees
Multi-institution tenancy
Microservices
Real-time WebSockets
AI-based attendance prediction
```

These can be listed as future enhancements.

---

# 37. Definition of Done

The MVP is considered complete when:

### Backend

- [ ] PostgreSQL schema implemented
- [ ] Prisma migrations work
- [ ] Seed data works
- [ ] JWT authentication works
- [ ] RBAC works
- [ ] Resource authorization works
- [ ] Validation implemented
- [ ] Central error handling implemented
- [ ] Admin APIs implemented
- [ ] Faculty APIs implemented
- [ ] Student APIs implemented
- [ ] Attendance workflow works
- [ ] Correction workflow works
- [ ] Audit logging works
- [ ] Reports work

### Database

- [ ] Foreign keys
- [ ] Unique constraints
- [ ] Indexes
- [ ] Transactions
- [ ] No duplicated attendance records
- [ ] Historical attendance protected

### Frontend

- [ ] Role selector
- [ ] JWT authentication state
- [ ] Protected routes
- [ ] Admin dashboard
- [ ] Faculty dashboard
- [ ] Student dashboard
- [ ] Attendance marking
- [ ] Attendance history
- [ ] Correction interface
- [ ] Low-attendance display

### Documentation

- [ ] README
- [ ] ERD
- [ ] API contract
- [ ] MVP requirements
- [ ] Assumptions
- [ ] Setup instructions
- [ ] Demo credentials/users
- [ ] AI Usage Report

---

# 38. Engineering Principle

The implementation should follow this rule:

> **Do not make the UI responsible for enforcing business rules that the backend can enforce.**

For example, hiding an Admin button from a Student is useful UX.

It is not security.

The actual security rule must exist in:

```text
JWT
  ↓
RBAC
  ↓
Resource authorization
  ↓
Service layer
  ↓
Database constraints
```

Similarly, the frontend may show:

```text
Attendance = 82%
```

but the backend should calculate that value from attendance records.

---

# 39. Implementation Priority

If development time becomes limited, prioritize in this order:

```text
1. Database correctness
2. Authentication
3. Authorization
4. Attendance workflow
5. Attendance history
6. Corrections
7. Low-attendance reporting
8. Admin CRUD
9. Dashboard UX
10. Visual polish
```

The project should be considered successful if the underlying attendance lifecycle is reliable even with a very basic UI.

---

# 40. Final MVP Architecture

```text
                         React Client
                              │
                              │ HTTPS / JSON
                              ▼
                     ┌─────────────────┐
                     │ Express API     │
                     ├─────────────────┤
                     │ JWT Middleware  │
                     │ RBAC            │
                     │ Validation      │
                     │ Controllers     │
                     │ Services        │
                     │ Repositories    │
                     └────────┬────────┘
                              │
                              ▼
                         PostgreSQL
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
       Academic           Attendance           Audit
        Domain              Domain             Domain
          │                   │                    │
     Students             Sessions            AuditLog
     Faculty              Records
     Subjects             Corrections
     Sections
     Offerings
     Enrollment
```

The MVP is intentionally a **modular monolith**. It is simple enough to build quickly while preserving clear boundaries between authentication, academic data, attendance, corrections, reporting, and audit functionality.