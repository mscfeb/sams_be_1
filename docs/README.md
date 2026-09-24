# Smart Attendance Management System

## Backend setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init_attendance_schema
npm run prisma:seed
npm start
```

The backend uses JavaScript ES modules, Express, Prisma, and PostgreSQL. Set `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`, and `CORS_ORIGIN` in `backend/.env`. Never commit real secrets.

## Frontend setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the backend API prefix, such as
`http://localhost:3000/api/v1`. Phase 9 provides demo role login, JWT
initialization through `/auth/me`, protected role routes, the application shell,
and navigation placeholders. The frontend stores the demo JWT in browser
`localStorage`; backend authorization remains authoritative.

## Phase 3 authentication

Demo login selects an active seeded user by role:

```http
POST /api/v1/auth/login
Content-Type: application/json

{"role":"FACULTY"}
```

Allowed roles are `ADMIN`, `FACULTY`, and `STUDENT`. Use the returned token as `Authorization: Bearer <token>` with:

```http
GET /api/v1/auth/me
```

The previous `/api/v1/auth/demo-login` path is retained as a compatibility alias. Temporary RBAC checks are available at `/api/v1/auth/test/admin`, `/api/v1/auth/test/faculty`, and `/api/v1/auth/test/student`.

## Phase 4 resource authorization

Temporary relationship checks use the authenticated JWT and actual Prisma relations:

```text
GET /api/v1/auth/access/offerings/:id
GET /api/v1/auth/access/sessions/:id
GET /api/v1/auth/access/students/:id
GET /api/v1/auth/access/records/:id
```

Faculty access is limited to assigned offerings and their sessions. Students are limited to their own student/attendance records and active enrollments. ADMIN has academic-resource access. These routes verify authorization only; attendance business APIs are not implemented yet.

## Phase 7 attendance summaries and corrections

Student attendance summaries are available at:

```text
GET /api/v1/students/me/attendance
GET /api/v1/students/me/attendance/history
GET /api/v1/reports/low-attendance
```

Only submitted sessions contribute to derived calculations. PRESENT and LATE count as attended, percentages are rounded to two decimals, and the default low-attendance threshold is 75%.

Correction workflow endpoints:

```text
POST /api/v1/corrections
GET /api/v1/corrections
POST /api/v1/corrections/:id/approve
POST /api/v1/corrections/:id/reject
```

Corrections use `PENDING -> APPROVED/REJECTED`; approval is an atomic record, request, and audit update. Submitted attendance remains immutable through direct marking APIs.

## Phase 8 dashboards

Role-specific read APIs are available at:

```text
GET /api/v1/dashboard/admin     # ADMIN
GET /api/v1/dashboard/faculty   # FACULTY
GET /api/v1/dashboard/student   # STUDENT
```

Dashboard data is derived from the existing academic and attendance tables. Faculty and student results are scoped from the verified JWT identity, recent lists are bounded with `limit=1..20`, and official attendance metrics exclude draft sessions.

## Phase 10 Admin academic management

The Admin frontend provides real CRUD screens for Departments, Academic Years,
Sections, Students, Faculty, Subjects, Subject Offerings, and Enrollments.
These screens use the Phase 5 APIs, server-side pagination, supported filters,
real relationship selectors, backend validation, and safe deactivation/delete
confirmation. Phase 11 adds debounced search, deferred dependency loading,
responsive shared UI, real Faculty attendance/correction workflows, and real
Student dashboard/history views. Student correction creation remains deferred
because the current backend contract does not authorize it.

## Phase 11 frontend

Faculty routes include `/faculty`, `/faculty/subjects`, `/faculty/attendance`,
and `/faculty/corrections`. Student routes include `/student`,
`/student/attendance`, and `/student/corrections`. The Admin screens remain
server-paginated and use feature-scoped API requests; no new backend endpoints
or persisted frontend state were added.

## Phase 5 admin academic APIs

ADMIN-only CRUD APIs are available for `/api/v1/departments`,
`/api/v1/academic-years`, `/api/v1/sections`, `/api/v1/students`,
`/api/v1/faculty`, `/api/v1/subjects`, `/api/v1/subject-offerings`, and
`/api/v1/enrollments`. List endpoints support bounded pagination and relationship
filters. Mutations validate foreign keys, use transactions where multiple
records are created, and write audit logs. Student and faculty DELETE requests
deactivate their User records to preserve history.

## Phase 6 attendance APIs

The attendance engine provides session creation/list/detail, session record
listing, draft record marking, atomic submission, and student self-attendance
read access under `/api/v1/attendance` and `/api/v1/students/me/attendance`.
New sessions generate `UNMARKED` records from active enrollments. Only the
assigned faculty member can manage a session, and submitted sessions cannot be
edited through direct marking APIs. Submitted attendance changes use the Phase 7
correction workflow.

## Verification

```powershell
npm test
npm run prisma:validate
npm run prisma:generate
npx prisma migrate status
```
