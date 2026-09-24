import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { listStudentAttendance } from "../attendance/attendance.service.js";
import { lowAttendance } from "../reports/report.service.js";

const offeringSelect = {
  id: true,
  semester: true,
  subject: { select: { code: true, name: true } },
  section: { select: { name: true, program: true } },
  academicYear: { select: { name: true } }
};

async function adminAttendanceOverview() {
  const [sessionCounts, attendance, lowAttendanceCount, pendingCorrections] = await Promise.all([
    prisma.attendanceSession.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.attendanceRecord.aggregate({
      where: { attendanceSession: { status: "SUBMITTED" } },
      _count: { _all: true }
    }),
    prisma.$queryRaw(Prisma.sql`
      SELECT COUNT(DISTINCT grouped.student_id)::int AS count
      FROM (
        SELECT ar.student_id, so.id
        FROM "AttendanceRecord" ar
        INNER JOIN "AttendanceSession" ass ON ass.id = ar.attendance_session_id
        INNER JOIN "SubjectOffering" so ON so.id = ass.subject_offering_id
        WHERE ass.status = 'SUBMITTED'
        GROUP BY ar.student_id, so.id
        HAVING COUNT(*) FILTER (WHERE ar.status IN ('PRESENT', 'LATE')) * 100.0 / NULLIF(COUNT(*), 0) < ${env.LOW_ATTENDANCE_THRESHOLD}
      ) grouped
    `),
    prisma.correctionRequest.count({ where: { status: "PENDING" } })
  ]);
  const submittedRecords = await prisma.attendanceRecord.count({ where: { attendanceSession: { status: "SUBMITTED" } } });
  const attendedRecords = await prisma.attendanceRecord.count({ where: { attendanceSession: { status: "SUBMITTED" }, status: { in: ["PRESENT", "LATE"] } } });
  const sessionStatus = Object.fromEntries(sessionCounts.map((item) => [item.status.toLowerCase(), item._count._all]));
  return {
    submittedSessions: sessionStatus.submitted ?? 0,
    draftSessions: sessionStatus.draft ?? 0,
    submittedRecords: attendance._count._all,
    overallAttendance: submittedRecords === 0 ? 0 : Math.round((attendedRecords / submittedRecords) * 10000) / 100,
    lowAttendanceStudents: lowAttendanceCount[0]?.count ?? 0,
    pendingCorrections
  };
}

export async function adminDashboard() {
  const [counts, attendance] = await Promise.all([
    Promise.all([
      prisma.department.count(),
      prisma.academicYear.count(),
      prisma.section.count(),
      prisma.student.count(),
      prisma.student.count({ where: { user: { isActive: true } } }),
      prisma.faculty.count(),
      prisma.faculty.count({ where: { user: { isActive: true } } }),
      prisma.subject.count(),
      prisma.subjectOffering.count(),
      prisma.enrollment.count({ where: { status: "ACTIVE" } })
    ]),
    adminAttendanceOverview()
  ]);
  return {
    academic: {
      departments: counts[0],
      academicYears: counts[1],
      sections: counts[2],
      students: counts[3],
      activeStudents: counts[4],
      faculty: counts[5],
      activeFaculty: counts[6],
      subjects: counts[7],
      subjectOfferings: counts[8],
      activeEnrollments: counts[9]
    },
    attendance,
    lowAttendanceThreshold: env.LOW_ATTENDANCE_THRESHOLD
  };
}

export async function facultyDashboard(user, limit) {
  const offerings = await prisma.subjectOffering.findMany({
    where: { faculty: { userId: user.id } },
    select: offeringSelect,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }]
  });
  const [sessionCounts, recentSessions, pendingCorrections, lowAttendanceResult] = await Promise.all([
    prisma.attendanceSession.groupBy({
      by: ["status"],
      where: { subjectOffering: { faculty: { userId: user.id } } },
      _count: { _all: true }
    }),
    prisma.attendanceSession.findMany({
      where: { subjectOffering: { faculty: { userId: user.id } } },
      select: {
        id: true,
        sessionDate: true,
        period: true,
        status: true,
        subjectOffering: { select: { subject: { select: { code: true, name: true } }, section: { select: { name: true } } } }
      },
      orderBy: [{ sessionDate: "desc" }, { period: "asc" }, { id: "asc" }],
      take: limit
    }),
    prisma.correctionRequest.count({ where: { requestedById: user.id, status: "PENDING" } }),
    lowAttendance({ threshold: env.LOW_ATTENDANCE_THRESHOLD, page: 1, limit: 1 }, user)
  ]);
  const statusCounts = Object.fromEntries(sessionCounts.map((item) => [item.status.toLowerCase(), item._count._all]));
  return {
    offerings,
    sessions: {
      draft: statusCounts.draft ?? 0,
      submitted: statusCounts.submitted ?? 0,
      recent: recentSessions
    },
    pendingCorrections,
    lowAttendanceStudents: lowAttendanceResult.pagination.totalItems,
    lowAttendanceThreshold: env.LOW_ATTENDANCE_THRESHOLD
  };
}

export async function studentDashboard(user, limit) {
  const [attendance, enrollments] = await Promise.all([
    listStudentAttendance({ page: 1, limit }, user),
    prisma.enrollment.findMany({
      where: { status: "ACTIVE", student: { userId: user.id } },
      select: { subjectOffering: { select: offeringSelect } },
      orderBy: { enrolledAt: "desc" }
    })
  ]);
  return {
    attendance: {
      overall: attendance.overall,
      subjects: attendance.subjects,
      recent: attendance.items
    },
    enrolledSubjects: enrollments.map((enrollment) => enrollment.subjectOffering),
    lowAttendanceSubjects: attendance.subjects.filter((subject) => subject.lowAttendance),
    lowAttendanceThreshold: env.LOW_ATTENDANCE_THRESHOLD
  };
}
