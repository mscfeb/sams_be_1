# Smart Attendance Management System
## ERD and Database Design — MVP

**Version:** 1.0  
**Status:** Implementation Baseline  
**Database:** PostgreSQL  
**ORM:** Prisma

---

## 1. Purpose

This document defines the relational data model for the Smart Attendance Management System MVP.

The design prioritizes:

- Referential integrity
- Attendance history
- Controlled corrections
- Auditability
- Role-based access
- Efficient attendance queries
- Avoiding duplicated derived data
- Future scalability to approximately 5,000 students and 200 faculty

Attendance percentage is **not stored as the source of truth**. It is derived from attendance sessions and attendance records.

---

# 2. Core Domain Model

The system contains the following major entities:

1. User
2. Department
3. AcademicYear
4. Section
5. Student
6. Faculty
7. Subject
8. SubjectOffering
9. Enrollment
10. AttendanceSession
11. AttendanceRecord
12. CorrectionRequest
13. AuditLog

---

# 3. Entity Relationship Overview

```text
                              ┌──────────────────┐
                              │       User       │
                              ├──────────────────┤
                              │ id PK            │
                              │ email UNIQUE     │
                              │ role             │
                              │ is_active        │
                              └────────┬─────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                         │ 1:1                       │ 1:1
                         ▼                           ▼
                ┌─────────────────┐        ┌─────────────────┐
                │     Student     │        │     Faculty     │
                ├─────────────────┤        ├─────────────────┤
                │ id PK           │        │ id PK           │
                │ user_id FK      │        │ user_id FK      │
                │ student_number  │        │ employee_number │
                │ department_id   │        │ department_id   │
                │ section_id      │        └────────┬────────┘
                └────────┬────────┘                 │
                         │                          │
                         │                          │
                         │                          │
                         │             ┌────────────▼────────────┐
                         │             │    SubjectOffering      │
                         │             ├─────────────────────────┤
                         │             │ id PK                   │
                         │             │ subject_id FK           │
                         │             │ faculty_id FK            │
                         │             │ section_id FK            │
                         │             │ academic_year_id FK      │
                         │             │ semester                │
                         │             └────────────┬────────────┘
                         │                          │
                         │                          │
                         │                   ┌──────▼───────┐
                         │                   │ Attendance    │
                         │                   │ Session       │
                         │                   ├───────────────┤
                         │                   │ id PK         │
                         │                   │ offering_id   │
                         │                   │ date          │
                         │                   │ period        │
                         │                   │ status        │
                         │                   └───────┬───────┘
                         │                           │
                         │                           │ 1:N
                         │                           ▼
                         │                   ┌──────────────────┐
                         └──────────────────►│ AttendanceRecord │
                                             ├──────────────────┤
                                             │ id PK            │
                                             │ session_id FK    │
                                             │ student_id FK    │
                                             │ status           │
                                             │ marked_by FK     │
                                             └────────┬─────────┘
                                                      │
                                                      │ 1:N
                                                      ▼
                                             ┌──────────────────┐
                                             │ CorrectionRequest│
                                             ├──────────────────┤
                                             │ id PK            │
                                             │ record_id FK     │
                                             │ requested_by FK  │
                                             │ old_status       │
                                             │ new_status       │
                                             │ reason           │
                                             │ status           │
                                             │ reviewed_by FK   │
                                             └──────────────────┘


┌─────────────────┐
│   Department    │
├─────────────────┤
│ id PK           │
│ code UNIQUE     │
│ name            │
└───────┬─────────┘
        │
        ├──────────── Student
        │
        ├──────────── Faculty
        │
        └──────────── Subject


┌─────────────────┐
│  AcademicYear   │
├─────────────────┤
│ id PK           │
│ name UNIQUE     │
│ start_date      │
│ end_date        │
│ is_active       │
└────────┬────────┘
         │
         ├──────────── Section
         │
         └──────────── SubjectOffering


┌─────────────────┐
│     Section     │
├─────────────────┤
│ id PK           │
│ name            │
│ program         │
│ semester        │
│ department_id   │
│ academic_year_id│
└────────┬────────┘
         │
         ├──────────── Student
         │
         └──────────── SubjectOffering


┌─────────────────┐
│     Subject     │
├─────────────────┤
│ id PK           │
│ code UNIQUE     │
│ name            │
│ credits         │
│ department_id   │
└────────┬────────┘
         │
         └──────────── SubjectOffering


Student ───────< Enrollment >────── SubjectOffering
```

---

# 4. User

Represents an authenticated identity.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR | UNIQUE, NOT NULL |
| role | ENUM | NOT NULL |
| is_active | BOOLEAN | NOT NULL, default true |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

Roles:

```text
ADMIN
FACULTY
STUDENT
```

For the assignment MVP, real credential authentication is intentionally simplified through demo role login.

The User entity remains because JWT authentication and authorization are still implemented.

---

# 5. Department

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR | UNIQUE, NOT NULL |
| name | VARCHAR | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

Example:

```text
CSE - Computer Science and Engineering
ISE - Information Science and Engineering
ECE - Electronics and Communication Engineering
```

---

# 6. AcademicYear

Represents an academic cycle.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | UNIQUE, NOT NULL |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL |
| is_active | BOOLEAN | NOT NULL |

Example:

```text
2026-27
```

Constraint:

```text
start_date < end_date
```

---

# 7. Section

Represents an academic class/section.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| program | VARCHAR | NOT NULL |
| semester | INTEGER | NOT NULL |
| department_id | UUID | FK |
| academic_year_id | UUID | FK |

Example:

```text
CSE-A
CSE-B
ISE-A
```

Recommended constraint:

```text
UNIQUE(name, department_id, academic_year_id)
```

---

# 8. Student

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | UNIQUE, FK |
| student_number | VARCHAR | UNIQUE, NOT NULL |
| first_name | VARCHAR | NOT NULL |
| last_name | VARCHAR | NOT NULL |
| department_id | UUID | FK |
| section_id | UUID | FK |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

A student belongs to one current section.

Historical attendance remains available even if the student's current academic information changes.

---

# 9. Faculty

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | UNIQUE, FK |
| employee_number | VARCHAR | UNIQUE, NOT NULL |
| first_name | VARCHAR | NOT NULL |
| last_name | VARCHAR | NOT NULL |
| department_id | UUID | FK |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

---

# 10. Subject

Represents the academic subject definition.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR | UNIQUE, NOT NULL |
| name | VARCHAR | NOT NULL |
| credits | INTEGER | NOT NULL |
| department_id | UUID | FK |

Example:

```text
CS301
Database Management Systems
4 credits
```

---

# 11. SubjectOffering

This is one of the most important entities.

A Subject represents **what is taught**.

A SubjectOffering represents:

> Who teaches the subject to which section during which academic period?

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| subject_id | UUID | FK |
| faculty_id | UUID | FK |
| section_id | UUID | FK |
| academic_year_id | UUID | FK |
| semester | INTEGER | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Example:

```text
DBMS
+
Prof. Ravi
+
CSE-A
+
2026-27
+
Semester 5
```

Recommended uniqueness:

```text
UNIQUE(
    subject_id,
    faculty_id,
    section_id,
    academic_year_id,
    semester
)
```

---

# 12. Enrollment

Represents a student's enrollment into a subject offering.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| student_id | UUID | FK |
| subject_offering_id | UUID | FK |
| status | ENUM | NOT NULL |
| enrolled_at | TIMESTAMP | NOT NULL |

Status:

```text
ACTIVE
DROPPED
COMPLETED
```

Constraint:

```text
UNIQUE(student_id, subject_offering_id)
```

This is preferable to assuming every student in a section is automatically enrolled in every subject.

---

# 13. AttendanceSession

Represents one actual class occurrence.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| subject_offering_id | UUID | FK |
| session_date | DATE | NOT NULL |
| period | INTEGER | NOT NULL |
| status | ENUM | NOT NULL |
| created_by | UUID | FK → User |
| created_at | TIMESTAMP | NOT NULL |
| submitted_at | TIMESTAMP | nullable |

Status:

```text
DRAFT
SUBMITTED
```

Recommended uniqueness:

```text
UNIQUE(subject_offering_id, session_date, period)
```

This prevents accidentally creating the same attendance session twice.

---

# 14. AttendanceRecord

Represents one student's attendance for one session.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| attendance_session_id | UUID | FK |
| student_id | UUID | FK |
| status | ENUM | NOT NULL |
| marked_by | UUID | FK → User |
| marked_at | TIMESTAMP | NOT NULL |

Status:

```text
PRESENT
ABSENT
LATE
```

Critical constraint:

```text
UNIQUE(attendance_session_id, student_id)
```

A student cannot have two attendance records for the same session.

---

# 15. Attendance Calculation

Attendance percentage is derived.

```text
Attended =
    PRESENT + LATE

Attendance % =
    Attended / Total Sessions × 100
```

For example:

```text
Total sessions = 25
Present = 20
Late = 2
Absent = 3

Attendance =
22 / 25 × 100
=
88%
```

The percentage should not be stored as a primary source of truth.

---

# 16. CorrectionRequest

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| attendance_record_id | UUID | FK |
| requested_by | UUID | FK → User |
| old_status | ENUM | NOT NULL |
| new_status | ENUM | NOT NULL |
| reason | TEXT | NOT NULL |
| status | ENUM | NOT NULL |
| reviewed_by | UUID | nullable |
| reviewed_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | NOT NULL |

Status:

```text
PENDING
APPROVED
REJECTED
```

A correction cannot be modified after being reviewed.

---

# 17. AuditLog

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK |
| action | VARCHAR | NOT NULL |
| entity_type | VARCHAR | NOT NULL |
| entity_id | UUID | NOT NULL |
| old_value | JSONB | nullable |
| new_value | JSONB | nullable |
| created_at | TIMESTAMP | NOT NULL |

Used for important state changes such as attendance corrections.

---

# 18. Critical Database Rules

The database must enforce:

```text
User.email UNIQUE

Student.student_number UNIQUE

Faculty.employee_number UNIQUE

Student.user_id UNIQUE

Faculty.user_id UNIQUE

Department.code UNIQUE

Subject.code UNIQUE

Enrollment(student_id, subject_offering_id) UNIQUE

AttendanceSession(
    subject_offering_id,
    session_date,
    period
) UNIQUE

AttendanceRecord(
    attendance_session_id,
    student_id
) UNIQUE
```

Foreign keys must be used throughout the domain.

---

# 19. Deletion Strategy

Historical attendance must not be accidentally destroyed.

For operational entities such as:

```text
User
Student
Faculty
```

prefer deactivation:

```text
is_active = false
```

rather than physical deletion where historical records depend on them.

For entities with historical attendance relationships, deletion should generally be restricted.

---

# 20. Important Indexes

At minimum:

```text
Student.department_id
Student.section_id

Faculty.department_id

Subject.department_id

SubjectOffering.faculty_id
SubjectOffering.section_id
SubjectOffering.subject_id

Enrollment.student_id
Enrollment.subject_offering_id

AttendanceSession.subject_offering_id
AttendanceSession.session_date

AttendanceRecord.attendance_session_id
AttendanceRecord.student_id

CorrectionRequest.status
CorrectionRequest.requested_by
```

These support the primary dashboard, history, and reporting queries.

---

# 21. Transaction Requirements

The following operations must use database transactions.

### Create attendance session

```text
BEGIN

Create AttendanceSession

Create AttendanceRecord for enrolled students

COMMIT
```

Failure anywhere must rollback the entire operation.

### Submit attendance

```text
BEGIN

Validate session
Validate records
Change DRAFT → SUBMITTED
Set submitted_at

COMMIT
```

### Approve correction

```text
BEGIN

Validate correction
Update AttendanceRecord
Update CorrectionRequest
Create AuditLog

COMMIT
```

---

# 22. Source of Truth

The source of truth is:

```text
AttendanceSession
        +
AttendanceRecord
```

Derived values include:

```text
Attendance percentage
Low attendance status
Overall attendance
Subject attendance
Department attendance
```

This prevents inconsistent stored percentages.