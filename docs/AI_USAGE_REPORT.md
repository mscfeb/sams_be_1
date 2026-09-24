# AI Usage Report

## Phase 3

AI assistance was used to:

- Inspect the existing Express and Prisma foundation.
- Add centralized environment validation, JWT helpers, application errors, and response helpers.
- Add authentication middleware, reusable RBAC middleware, and Zod validation.
- Implement demo role login, authenticated-user lookup, and temporary RBAC verification routes.
- Add focused Node test coverage for health, login, JWT protection, `/auth/me`, and role authorization.
- Run and review the Phase 3 verification commands.

The implementation was checked against the project documents and kept within the Phase 3 scope. No attendance, correction, reporting, dashboard, or frontend functionality was added.

## Phase 4

AI assistance was used to:

- Inspect the existing Prisma relations, deterministic seed fixtures, Phase 3 authentication middleware, and tests.
- Add explicit authorization helpers for admin access, faculty offering/session ownership, student ownership, active enrollment, and attendance-record ownership.
- Add reusable resource authorization middleware and temporary database-backed access verification routes.
- Add integration tests against the actual PostgreSQL data for faculty, student, admin, unauthenticated, and invalid-ID scenarios.
- Update API/setup documentation with the Phase 4 verification routes and authorization rules.

Validation results are recorded from the commands actually executed during this phase. No attendance marking, correction, reporting, dashboard, or frontend functionality was added.

## Phase 5

AI assistance was used to:

- Inspect the existing Prisma schema, migrations, seed data, authentication, resource authorization, validation, errors, responses, and tests.
- Implement ADMIN-only academic CRUD APIs for departments, academic years, sections, students, faculty, subjects, subject offerings, and enrollments.
- Add shared pagination/filter validation, explicit Prisma selects, foreign-key checks, transactional User/profile creation, safe person deactivation, and reusable audit logging.
- Add integration tests against the actual PostgreSQL database for authorization, dependency creation, pagination/filtering, duplicate constraints, invalid references, PATCH validation, and audit records.
- Update the API contract and README with the implemented Phase 5 behavior.

The remote PostgreSQL environment required a 15-second interactive transaction timeout for multi-record mutations. No attendance, correction, report, dashboard, or frontend functionality was added.

## Phase 6

AI assistance was used to:

- Inspect the attendance Prisma models, enrollment relationships, Phase 4 authorization helpers, Phase 5 conventions, and API contract.
- Implement transactional attendance-session creation with active-enrollment record generation using `UNMARKED`.
- Implement faculty-scoped session reads, record reads, draft record marking, atomic submission, student self-attendance reads, and audit events.
- Add integration tests against the actual PostgreSQL database for ownership, state transitions, duplicate sessions, incomplete submission, record initialization, and submitted-session locking.
- Update the API contract and README with the implemented Phase 6 behavior.

Important decisions: new records remain `UNMARKED` rather than being treated as absent; submitted sessions are immutable through normal attendance APIs; faculty identity is derived from the verified JWT; session creation and submission use serializable transactions; correction requests remained out of scope for Phase 6.

## Phase 7

AI assistance was used to:

- Inspect the existing attendance, enrollment, correction, audit, authorization, and API-contract implementations.
- Add derived attendance calculations for submitted sessions, student subject/overall summaries, filtered history, and configurable low-attendance reporting.
- Implement correction creation, listing, approval, and rejection with JWT-derived requester/reviewer identities, transactional state transitions, and audit events.
- Add PostgreSQL-backed integration tests for draft exclusion, summary calculations, low-attendance filtering, correction uniqueness, rejection, approval, and authorization.
- Update the API contract and README with the actual Phase 7 endpoints and rules.

Important decisions: percentages remain derived rather than stored; PRESENT and LATE count as attended; DRAFT and UNMARKED records are excluded from official summaries; low attendance uses `< 75` by default; submitted records change only through the correction workflow; correction approval/rejection uses serializable transactions.

## Phase 9

AI assistance was used to:

- Inspect the existing backend auth/dashboard contracts and confirm that no frontend existed yet.
- Scaffold a JavaScript Vite/React application with Axios, React Router, and Context-based authentication.
- Implement environment-driven API configuration, centralized JWT attachment, normalized API errors, 401 logout/redirect handling, and `/auth/me` initialization.
- Implement demo role login, protected routes, role guards, role-specific navigation, application shell, loading/error states, 403/404 pages, and honest placeholder pages.
- Add the frontend README and root setup documentation without implementing dashboard widgets or academic workflows.

Validation performed: frontend dependency installation, Vite production build, backend startup, and real backend demo-login smoke checks. The frontend development server reported ready on the local Vite port; no frontend test framework or lint script existed, so none was added for this foundation phase.

## Phase 8

AI assistance was used to:

- Inspect the existing dashboard contract, Phase 7 calculation/report services, authorization middleware, Prisma schema, and integration tests.
- Implement role-specific admin, faculty, and student dashboard APIs as read models over existing academic, attendance, enrollment, and correction data.
- Reuse Phase 7 calculation and low-attendance behavior rather than introducing duplicate formulas or persisted dashboard tables.
- Add bounded dashboard results, database-side attendance aggregation, faculty ownership scoping, student identity scoping, and role/authentication tests.
- Update the API contract and README with the implemented dashboard endpoints and response behavior.

Validation for Phase 8 includes the focused dashboard integration suite and the complete regression/database checks actually run after implementation. No frontend or persisted dashboard entities were added.

## Phase 10

AI assistance was used to:

- Inspect the Phase 5 academic API schemas, routes, response shapes, Phase 9 React shell, and existing authentication/API client.
- Add centralized API wrappers for all eight academic resources.
- Replace Admin placeholder routes with functional screens for Departments, Academic Years, Sections, Students, Faculty, Subjects, Subject Offerings, and Enrollments.
- Add restrained reusable table, pagination, modal, form, status, empty, and feedback components.
- Implement server-side pagination/search/filtering, relationship-backed selectors, create/edit mutations, safe deactivation/delete confirmation, and backend error feedback.
- Keep Faculty/Student workflows, attendance UI, correction UI, reports, and dashboard widgets out of scope.

Validation performed: frontend production build passed, frontend diagnostics reported no errors, and the complete backend regression suite passed all 33 tests. No frontend test or lint script existed.

## Phase 11

AI assistance was used to:

- Audit the Phase 10 Admin resource page for request storms and eager dependency loading.
- Add debounced server-side search and defer relationship option requests until filters or an open form need them.
- Add shared dashboard/stat, inline status, and attendance workflow presentation components plus responsive styles.
- Implement Faculty dashboard, assigned subjects, attendance session creation/marking/submission, and correction-request screens using the existing APIs.
- Implement Student dashboard, derived attendance summary, and paginated attendance history screens using the existing Phase 7/8 APIs.
- Preserve backend role/resource authorization and keep Student corrections as an honest placeholder because the current backend contract does not support student correction creation.

Validation performed: frontend production build passed after fixing the route helper syntax introduced during implementation, frontend diagnostics reported no errors, and the backend regression command was attempted but skipped by the terminal environment during the final run. No performance timings were invented.
