import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { env } from "../../config/env.js";

export async function lowAttendance(query, user) {
  const filters = [Prisma.sql`asess.status = 'SUBMITTED'`];
  if (query.subjectOfferingId) filters.push(Prisma.sql`so.id = ${query.subjectOfferingId}::uuid`);
  if (query.sectionId) filters.push(Prisma.sql`so.section_id = ${query.sectionId}::uuid`);
  if (query.departmentId) filters.push(Prisma.sql`sec.department_id = ${query.departmentId}::uuid`);
  if (user.role === "FACULTY") filters.push(Prisma.sql`f.user_id = ${user.id}::uuid`);

  const where = Prisma.join(filters, " AND ");
  const threshold = query.threshold ?? env.LOW_ATTENDANCE_THRESHOLD;
  const base = Prisma.sql`
    FROM "AttendanceRecord" ar
    INNER JOIN "AttendanceSession" asess ON asess.id = ar.attendance_session_id
    INNER JOIN "SubjectOffering" so ON so.id = asess.subject_offering_id
    INNER JOIN "Faculty" f ON f.id = so.faculty_id
    INNER JOIN "Student" st ON st.id = ar.student_id
    INNER JOIN "Subject" subj ON subj.id = so.subject_id
    INNER JOIN "Section" sec ON sec.id = so.section_id
    WHERE ${where}
    GROUP BY st.id, st.first_name, st.last_name, so.id, subj.code, subj.name
    HAVING (COUNT(*) FILTER (WHERE ar.status IN ('PRESENT', 'LATE')) * 100.0 / NULLIF(COUNT(*), 0)) < ${threshold}
  `;
  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw(Prisma.sql`
      SELECT
        st.id AS "studentId",
        CONCAT(st.first_name, ' ', st.last_name) AS "studentName",
        so.id AS "subjectOfferingId",
        subj.code AS "subjectCode",
        subj.name AS "subjectName",
        COUNT(*)::int AS conducted,
        COUNT(*) FILTER (WHERE ar.status IN ('PRESENT', 'LATE'))::int AS attended,
        ROUND((COUNT(*) FILTER (WHERE ar.status IN ('PRESENT', 'LATE')) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 2)::float8 AS attendance
      ${base}
      ORDER BY attendance ASC, "studentName" ASC, "studentId" ASC
      LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit}
    `),
    prisma.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS total FROM (SELECT 1 ${base}) low_attendance`)
  ]);
  const totalItems = countRows[0]?.total ?? 0;
  return {
    threshold,
    items: rows,
    pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) }
  };
}
