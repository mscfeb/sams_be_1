# Smart Attendance Management System
## REST API Contract — MVP

**Version:** v1  
**Base URL:** `/api/v1`  
**Protocol:** HTTP/HTTPS  
**Format:** JSON  
**Authentication:** JWT Bearer Token

---

# 1. API Principles

The API follows:

- REST-style resource naming
- JSON request/response bodies
- JWT authentication
- Backend-enforced RBAC
- Resource ownership checks
- Input validation
- Consistent response structures
- HTTP status codes
- Database transactions for multi-step operations

The frontend must never be treated as a security boundary.

---

# 2. Authentication

## POST `/auth/login`

Creates a demo authenticated session.

This replaces real credential authentication for the assignment MVP.

### Request

```json
{
  "role": "FACULTY"
}
```

Allowed roles:

```text
ADMIN
FACULTY
STUDENT
```

### Response

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "uuid",
      "role": "FACULTY"
    }
  }
}
```

The backend selects a seeded demo user for the requested role.

`POST /auth/demo-login` remains available as a compatibility alias for the
same demo-login behavior.

---

## GET `/auth/me`

Returns the authenticated user.

### Authentication

Required.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "faculty@example.com",
    "role": "FACULTY"
  }
}
```

---

# 3. Authentication Header

Protected requests use:

```http
Authorization: Bearer <access-token>
```

JWT payload:

```json
{
  "sub": "user-id",
  "role": "FACULTY"
}
```

JWT secrets and expiration settings must come from environment variables.

## Admin Academic Management APIs

The following resources are available under `/api/v1`:

```text
departments
academic-years
sections
students
faculty
subjects
subject-offerings
enrollments
```

Each resource supports authenticated ADMIN-only `GET /`, `GET /:id`, `POST`,
`PATCH /:id`, and `DELETE /:id` operations. List endpoints accept `page` and
`limit` (`1-100`) and return `items` with pagination metadata. Resource-specific
filters include search and the applicable department, section, academic-year,
subject, faculty, offering, student, and enrollment-status relationships.

Student and faculty deletion deactivates the related User rather than removing
historical identity records. Other deletes return `409 RESOURCE_IN_USE` when
foreign-key relationships protect dependent records. Mutations validate
references, use transactions for multi-record work, and create an AuditLog
entry with the authenticated ADMIN as actor.

---

# 4. Authorization Model

Authorization has two levels.

## Role authorization

Example:

```text
ADMIN → create student
FACULTY → mark attendance
STUDENT → view own attendance
```

## Resource authorization

A faculty member can only access attendance belonging to subject offerings assigned to that faculty member.

A student can only access their own attendance.

Frontend route restrictions are convenience only. Backend authorization is mandatory.

## Resource Authorization Verification

The following temporary development endpoints verify database-backed access rules:

```text
GET /auth/access/offerings/:id
GET /auth/access/sessions/:id
GET /auth/access/students/:id
GET /auth/access/records/:id
```

All require a JWT. Faculty access to offerings and sessions requires the
authenticated faculty user's actual assignment. Student access to offerings
requires an active enrollment, and student/record access requires ownership
through the authenticated user's Student relation. ADMIN may access these
academic resources. Unauthorized relationship access returns `403 Forbidden`.

---

# 5. Standard Success Response

Single resource:

```json
{
  "success": true,
  "data": {}
}
```

Collection:

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

# 6. Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_SESSION_LOCKED",
    "message": "Attendance has already been submitted."
  }
}
```

Validation error may include fields:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "fields": {
      "sessionDate": "Invalid date."
    }
  }
}
```

---

# 7. HTTP Status Codes

```text
200 OK
201 CREATED
204 NO_CONTENT

400 BAD_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
422 UNPROCESSABLE_ENTITY
500 INTERNAL_SERVER_ERROR
```

---

# 8. Department APIs

## GET `/departments`

Roles:

```text
ADMIN
FACULTY
```

Returns departments.

---

## POST `/departments`

Role:

```text
ADMIN
```

Request:

```json
{
  "code": "CSE",
  "name": "Computer Science and Engineering"
}
```

Response:

```text
201 CREATED
```

---

## PATCH `/departments/:id`

Role:

```text
ADMIN
```

Request:

```json
{
  "name": "Computer Science & Engineering"
}
```

---

# 9. Academic Year APIs

## GET `/academic-years`

Roles:

```text
ADMIN
FACULTY
STUDENT
```

---

## POST `/academic-years`

Role:

```text
ADMIN
```

Request:

```json
{
  "name": "2026-27",
  "startDate": "2026-06-01",
  "endDate": "2027-05-31"
}
```

---

# 10. Section APIs

## GET `/sections`

Supports filtering:

```text
GET /sections?departmentId=...&academicYearId=...
```

---

## POST `/sections`

Role:

```text
ADMIN
```

Request:

```json
{
  "name": "CSE-A",
  "program": "B.Tech CSE",
  "semester": 5,
  "departmentId": "uuid",
  "academicYearId": "uuid"
}
```

---

## PATCH `/sections/:id`

Role:

```text
ADMIN
```

---

# 11. Student APIs

## GET `/students`

Role:

```text
ADMIN
```

Supports:

```text
page
limit
search
departmentId
sectionId
```

Example:

```text
GET /students?page=1&limit=20&search=rahul
```

---

## GET `/students/:id`

Roles:

```text
ADMIN
FACULTY
```

Faculty access must be limited to relevant academic data.

---

## POST `/students`

Role:

```text
ADMIN
```

Request:

```json
{
  "email": "student@example.com",
  "studentNumber": "CSE2026001",
  "firstName": "Rahul",
  "lastName": "Sharma",
  "departmentId": "uuid",
  "sectionId": "uuid"
}
```

---

## PATCH `/students/:id`

Role:

```text
ADMIN
```

---

# 12. Faculty APIs

## GET `/faculty`

Role:

```text
ADMIN
```

---

## GET `/faculty/:id`

Roles:

```text
ADMIN
```

---

## POST `/faculty`

Role:

```text
ADMIN
```

Request:

```json
{
  "email": "faculty@example.com",
  "employeeNumber": "FAC001",
  "firstName": "Ravi",
  "lastName": "Kumar",
  "departmentId": "uuid"
}
```

---

## PATCH `/faculty/:id`

Role:

```text
ADMIN
```

---

# 13. Subject APIs

## GET `/subjects`

Roles:

```text
ADMIN
FACULTY
STUDENT
```

---

## POST `/subjects`

Role:

```text
ADMIN
```

Request:

```json
{
  "code": "CS301",
  "name": "Database Management Systems",
  "credits": 4,
  "departmentId": "uuid"
}
```

---

## PATCH `/subjects/:id`

Role:

```text
ADMIN
```

---

# 14. Subject Offering APIs

## GET `/subject-offerings`

Supports:

```text
facultyId
sectionId
subjectId
academicYearId
semester
```

Admin can view all.

Faculty can view assigned offerings.

Students can view offerings in which they are enrolled.

---

## GET `/faculty/me/subject-offerings`

Role:

```text
FACULTY
```

Returns offerings assigned to the authenticated faculty member.

---

## POST `/subject-offerings`

Role:

```text
ADMIN
```

Request:

```json
{
  "subjectId": "uuid",
  "facultyId": "uuid",
  "sectionId": "uuid",
  "academicYearId": "uuid",
  "semester": 5
}
```

Business validations:

```text
Subject exists
Faculty exists
Section exists
Academic year exists
Faculty can teach the offering
No duplicate offering
```

---

## GET `/subject-offerings/:id`

Roles:

```text
ADMIN
FACULTY
STUDENT
```

Resource-level authorization is required.

---

# 15. Enrollment APIs

## GET `/enrollments`

Admin access.

Optional filters:

```text
studentId
subjectOfferingId
sectionId
```

---

## POST `/enrollments`

Role:

```text
ADMIN
```

Request:

```json
{
  "studentId": "uuid",
  "subjectOfferingId": "uuid"
}
```

Validation:

```text
Student exists
Offering exists
Student belongs to the offering section
Student is not already enrolled
```

---

## DELETE `/enrollments/:id`

Role:

```text
ADMIN
```

For MVP this can mark the enrollment as `DROPPED` rather than physically deleting it.

---

# 16. Attendance Session APIs

## POST `/attendance/sessions`

Role:

```text
FACULTY
```

Request:

```json
{
  "subjectOfferingId": "uuid",
  "sessionDate": "2026-09-24",
  "period": 2
}
```

Business workflow:

```text
1. Authenticate faculty
2. Verify faculty owns subject offering
3. Verify date
4. Verify period
5. Check duplicate session
6. Find active enrolled students
7. Create attendance session
8. Create one attendance record per enrolled student
9. Commit transaction
```

New records should initially have:

```text
status = ABSENT
```

or an explicit `UNMARKED` state if we choose to add one.

For the MVP, using `ABSENT` as an initial state is risky because it can be confused with a deliberately marked absence. Therefore the preferred design is to add:

```text
UNMARKED
```

to the internal attendance status enum.

Final statuses remain:

```text
PRESENT
ABSENT
LATE
```

A session cannot be submitted while records remain `UNMARKED`.

---

# 17. GET `/attendance/sessions`

Roles:

```text
ADMIN
FACULTY
```

Faculty receives only sessions belonging to their offerings.

Supports:

```text
subjectOfferingId
date
status
page
limit
```
# 18. GET `/attendance/sessions/:id`

Roles:

```text
ADMIN
FACULTY
```

Returns:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2026-09-24",
    "period": 2,
    "status": "DRAFT",
    "subject": {
      "code": "CS301",
      "name": "Database Management Systems"
    },
    "section": "CSE-A",
    "records": [
      {
        "id": "uuid",
        "studentId": "uuid",
        "studentName": "Rahul Sharma",
        "status": "PRESENT"
      }
    ]
  }
}
```

---

# 19. PATCH `/attendance/records/:id`

Role:

```text
FACULTY
```

Request:

```json
{
  "status": "PRESENT"
}
```

Rules:

```text
Faculty must own the session.
Session must be DRAFT.
Student must belong to session.
Status must be valid.
```

If session is already submitted:

```text
409 ATTENDANCE_SESSION_LOCKED
```

---

# 20. POST `/attendance/sessions/:id/submit`

Role:

```text
FACULTY
```

Business rules:

```text
1. Faculty must own session.
2. Session must be DRAFT.
3. Session must have at least one record.
4. No record may remain UNMARKED.
5. Change status to SUBMITTED.
6. Set submitted_at.
```

This operation must be transactional.

---

# 21. Student Attendance APIs

## GET `/students/me/attendance`

Role:

```text
STUDENT
```

Response:

```json
{
  "success": true,
  "data": {
    "overall": 82.4,
    "subjects": [
      {
        "subjectOfferingId": "uuid",
        "subjectCode": "CS301",
        "subjectName": "Database Management Systems",
        "conducted": 25,
        "attended": 22,
        "percentage": 88
      }
    ]
  }
}
```

---

## GET `/students/me/attendance/history`

Role:

```text
STUDENT
```

Supports:

```text
subjectOfferingId
from
to
page
limit
```

Official summaries count SUBMITTED sessions only. PRESENT and LATE count as
attended; DRAFT sessions and UNMARKED records are excluded. Percentages are
rounded to two decimals, and low attendance means a percentage below the
configured threshold, which defaults to 75%. History returns filtered,
paginated submitted records.

---

# 22. Low Attendance Report

## GET `/reports/low-attendance`

Roles:

```text
ADMIN
FACULTY
```

Query parameters:

```text
threshold
subjectOfferingId
sectionId
departmentId
page
limit
```

Default threshold:

```text
75
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "studentId": "uuid",
      "studentName": "Rahul Sharma",
      "subjectCode": "CS301",
      "attendance": 68
    }
  ]
}
```

The threshold should be configurable at the application level.

## Attendance Session and Record APIs

The attendance engine exposes:

```text
POST  /attendance/sessions
GET   /attendance/sessions
GET   /attendance/sessions/:id
GET   /attendance/sessions/:id/records
PATCH /attendance/records/:id
POST  /attendance/sessions/:id/submit
GET   /students/me/attendance
```

Faculty may create sessions only for assigned subject offerings. Session
creation uses active enrollments and creates exactly one `UNMARKED` record per
eligible student. Faculty may edit records while a session is `DRAFT`; direct
record changes are rejected with `409 ATTENDANCE_SESSION_LOCKED` after
submission. Submission is allowed only for a draft session with no `UNMARKED`
records and transitions the session atomically to `SUBMITTED` with
`submittedAt` set by the server. Students can read only their own attendance.
Correction requests use `PENDING -> APPROVED` or `PENDING -> REJECTED`.
Approval updates the submitted record transactionally and rejection leaves it
unchanged. Direct edits to submitted attendance remain blocked.

---

# 23. Correction APIs

## POST `/corrections`

Role:

```text
FACULTY
```

Request:

```json
{
  "attendanceRecordId": "uuid",
  "newStatus": "PRESENT",
  "reason": "Student was present but was incorrectly marked absent."
}
```

Rules:

```text
Record must exist.
Faculty must own the attendance session.
Session must be SUBMITTED.
Record must not already have a pending correction.
New status must differ from old status.
Reason is required.
```

---

## GET `/corrections`

Roles:

```text
ADMIN
FACULTY
```

Admin sees all.

Faculty sees requests submitted by themselves.

Filters:

```text
status
facultyId
subjectOfferingId
page
limit
```

`page` defaults to `1`; `limit` defaults to `20` and must be between `1` and
`100`. `facultyId` and `subjectOfferingId` are UUID filters available to Admin;
Faculty always sees only requests they created. Filtering and pagination are
performed in the database.

Each item is a compact view model rather than a full database record. It
contains the correction `id`, `oldStatus`, `newStatus`, `reason`, `status`,
`reviewedAt`, and `createdAt`, plus the student's `studentNumber`, `firstName`,
and `lastName`, and the session's `sessionDate`, `period`, and subject `code`.
Internal user and record identifiers and unrelated relationship fields are
omitted from this list response.

The response follows the standard success envelope. `data` contains `items`
and `pagination` (`page`, `limit`, `totalItems`, `totalPages`).

---

## POST `/corrections/:id/approve`

Role:

```text
ADMIN
```

Transaction:

```text
1. Verify PENDING
2. Update AttendanceRecord
3. Mark CorrectionRequest APPROVED
4. Set reviewed_by
5. Set reviewed_at
6. Create AuditLog
7. Commit
```

---

## POST `/corrections/:id/reject`

Role:

```text
ADMIN
```

Transaction:

```text
1. Verify PENDING
2. Mark REJECTED
3. Set reviewed_by
4. Set reviewed_at
5. Create AuditLog
6. Commit
```

---

# 24. Dashboard APIs

## GET `/dashboard/admin`

Role:

```text
ADMIN
```

Returns summary:

```json
{
  "students": 5000,
  "faculty": 200,
  "averageAttendance": 82.4,
  "lowAttendanceStudents": 427,
  "pendingCorrections": 12
}
```

---

## GET `/dashboard/faculty`

Role:

```text
FACULTY
```

Returns:

```text
Assigned offerings
Today's sessions
Recent attendance sessions
Low-attendance students in assigned offerings
```

---

## GET `/dashboard/student`

Role:

```text
STUDENT
```

Returns:

```text
Overall attendance
Subject attendance
Low-attendance subjects
Recent attendance
```

Dashboard endpoints are available under `/api/v1/dashboard` and require the
matching role. Admin receives academic counts, submitted/draft session counts,
overall submitted attendance, low-attendance student count, and pending
correction count. Faculty receives only offerings and sessions assigned through
the authenticated Faculty relation, plus scoped pending/low-attendance work.
Student receives the Phase 7 derived overall/subject summaries, enrolled
subjects, and bounded recent attendance for the authenticated Student.
Dashboard calculations exclude DRAFT sessions, reuse the 75% low-attendance
threshold, and do not persist dashboard-specific data.

---

# 25. Audit APIs

Audit logs should not be editable through the standard application API.

Admin may have read access:

```text
GET /audit-logs
```

Filters:

```text
userId
entityType
entityId
action
from
to
page
limit
```

---

# 26. API Security Requirements

Every protected request must pass:

```text
Request
  ↓
JWT verification
  ↓
User lookup / validation
  ↓
Role authorization
  ↓
Resource authorization
  ↓
Controller
```

Never trust:

```text
userId
facultyId
studentId
role
```

from the client when these values can be derived from the authenticated user.

For example, faculty correction requests should derive:

```text
requested_by = req.user.id
```

rather than accepting `requestedBy` from the request body.

---

# 27. Validation

All incoming request bodies, query parameters, and route parameters must be validated using Zod.

Examples:

```text
UUID validation
Date validation
Enum validation
Positive integer validation
String length validation
Required field validation
```

Business validation belongs in the service layer.

Schema validation belongs at the API boundary.

---

# 28. Pagination

Collection endpoints should default to:

```text
page = 1
limit = 20
```

Maximum:

```text
limit = 100
```

The server must reject or cap excessively large limits.

---

# 29. API Module Structure

Recommended backend organization:

```text
src/modules/

auth/
students/
faculty/
departments/
academic-years/
sections/
subjects/
subject-offerings/
enrollments/
attendance/
corrections/
reports/
dashboard/
audit/
```

Each module can contain:

```text
controller
service
repository
schema
routes
```

---

# 30. API Business Rule Summary

The most important rules are:

```text
Faculty can only mark attendance for assigned offerings.

Students can only see their own attendance.

Submitted attendance cannot be directly edited.

Historical changes require correction workflow.

Only Admin can approve corrections.

Attendance records cannot be duplicated.

A session cannot be submitted with UNMARKED records.

A correction cannot be reviewed twice.

Attendance percentage is derived from records.

Important multi-step operations use database transactions.
```
