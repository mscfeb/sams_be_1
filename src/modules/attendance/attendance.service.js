import prisma from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { createAuditLog } from "../audit/audit.service.js";
import { AppError } from "../../utils/errors.js";
import { groupByOffering, summarizeRecords } from "./attendance-calculation.service.js";

const sessionSelect = {
  id: true,
  subjectOfferingId: true,
  sessionDate: true,
  period: true,
  status: true,
  createdAt: true,
  submittedAt: true,
  subjectOffering: {
    select: {
      subject: { select: { code: true, name: true } },
      section: { select: { id: true, name: true } }
    }
  }
};

const recordSelect = {
  id: true,
  studentId: true,
  status: true,
  markedAt: true,
  student: { select: { studentNumber: true, firstName: true, lastName: true } }
};

function parseSessionDate(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new AppError(422, "INVALID_SESSION_DATE", "sessionDate must be a valid calendar date.");
  }
  return parsed;
}

function sessionNotFound() {
  return new AppError(404, "ATTENDANCE_SESSION_NOT_FOUND", "Attendance session not found.");
}

function forbidden() {
  return new AppError(403, "ATTENDANCE_SESSION_FORBIDDEN", "You do not have permission to access this attendance session.");
}

async function facultyOffering(transaction, userId, subjectOfferingId) {
  const offering = await transaction.subjectOffering.findFirst({
    where: { id: subjectOfferingId, faculty: { userId } },
    select: { id: true }
  });
  if (!offering) throw forbidden();
  return offering;
}

async function ownedSession(transaction, user, id) {
  const where = user.role === "ADMIN"
    ? { id }
    : { id, subjectOffering: { faculty: { userId: user.id } } };
  const session = await transaction.attendanceSession.findFirst({ where, select: { id: true, status: true, subjectOfferingId: true } });
  if (!session) {
    if (user.role === "FACULTY") throw forbidden();
    throw sessionNotFound();
  }
  return session;
}

function translateAttendanceError(error) {
  if (error.code === "P2002") {
    throw new AppError(409, "ATTENDANCE_SESSION_ALREADY_EXISTS", "An attendance session already exists for this offering, date, and period.");
  }
  throw error;
}

export async function createSession(input, user) {
  const sessionDate = parseSessionDate(input.sessionDate);

  try {
    return await prisma.$transaction(async (transaction) => {
      await facultyOffering(transaction, user.id, input.subjectOfferingId);
      const enrollments = await transaction.enrollment.findMany({
        where: { subjectOfferingId: input.subjectOfferingId, status: "ACTIVE" },
        select: { studentId: true }
      });
      if (enrollments.length === 0) {
        throw new AppError(409, "NO_ACTIVE_ENROLLMENTS", "The subject offering has no active enrollments.");
      }

      const session = await transaction.attendanceSession.create({
        data: {
          subjectOfferingId: input.subjectOfferingId,
          sessionDate,
          period: input.period,
          createdById: user.id
        },
        select: { id: true, subjectOfferingId: true, sessionDate: true, period: true, status: true, createdAt: true }
      });

      await transaction.attendanceRecord.createMany({
        data: enrollments.map(({ studentId }) => ({
          attendanceSessionId: session.id,
          studentId,
          status: "UNMARKED",
          markedById: user.id
        }))
      });

      await createAuditLog(transaction, {
        actorUserId: user.id,
        action: "CREATE",
        entityType: "ATTENDANCE_SESSION",
        entityId: session.id,
        newValue: { subjectOfferingId: input.subjectOfferingId, sessionDate: input.sessionDate, period: input.period, recordCount: enrollments.length }
      });

      return session;
    }, { timeout: 15000, isolationLevel: "Serializable" });
  } catch (error) {
    return translateAttendanceError(error);
  }
}

export async function listSessions(query, user) {
  const where = {
    ...(query.subjectOfferingId && { subjectOfferingId: query.subjectOfferingId }),
    ...(query.date && { sessionDate: parseSessionDate(query.date) }),
    ...(query.status && { status: query.status }),
    ...(user.role === "FACULTY" && { subjectOffering: { faculty: { userId: user.id } } })
  };
  const [totalItems, items] = await prisma.$transaction([
    prisma.attendanceSession.count({ where }),
    prisma.attendanceSession.findMany({
      where,
      select: sessionSelect,
      orderBy: [{ sessionDate: "desc" }, { period: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })
  ]);
  return { items, pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) } };
}

export async function getSession(id, user) {
  const session = await prisma.attendanceSession.findFirst({
    where: user.role === "ADMIN" ? { id } : { id, subjectOffering: { faculty: { userId: user.id } } },
    select: { ...sessionSelect, attendanceRecords: { select: recordSelect, orderBy: [{ student: { studentNumber: "asc" } }, { id: "asc" }] } }
  });
  if (!session) {
    if (user.role === "FACULTY") throw forbidden();
    throw sessionNotFound();
  }
  return session;
}

export async function listSessionRecords(sessionId, user) {
  await ownedSession(prisma, user, sessionId);
  return prisma.attendanceRecord.findMany({
    where: { attendanceSessionId: sessionId },
    select: recordSelect,
    orderBy: [{ student: { studentNumber: "asc" } }, { id: "asc" }]
  });
}

export async function updateRecord(id, status, user) {
  try {
    return await prisma.$transaction(async (transaction) => {
      const record = await transaction.attendanceRecord.findFirst({
        where: { id, attendanceSession: { subjectOffering: { faculty: { userId: user.id } } } },
        select: { id: true, status: true, attendanceSessionId: true, attendanceSession: { select: { status: true } } }
      });
      if (!record) throw new AppError(403, "ATTENDANCE_RECORD_FORBIDDEN", "You do not have permission to modify this attendance record.");
      if (record.attendanceSession.status !== "DRAFT") {
        throw new AppError(409, "ATTENDANCE_SESSION_LOCKED", "Submitted attendance cannot be directly edited.");
      }

      const updated = await transaction.attendanceRecord.update({
        where: { id },
        data: { status, markedById: user.id, markedAt: new Date() },
        select: recordSelect
      });
      await createAuditLog(transaction, {
        actorUserId: user.id,
        action: "UPDATE",
        entityType: "ATTENDANCE_RECORD",
        entityId: id,
        oldValue: { status: record.status },
        newValue: { status }
      });
      return updated;
    }, { timeout: 15000, isolationLevel: "Serializable" });
  } catch (error) {
    throw error;
  }
}

export async function submitSession(id, user) {
  try {
    return await prisma.$transaction(async (transaction) => {
      const session = await transaction.attendanceSession.findFirst({
        where: { id, subjectOffering: { faculty: { userId: user.id } } },
        select: { id: true, status: true, submittedAt: true }
      });
      if (!session) throw forbidden();
      if (session.status !== "DRAFT") {
        throw new AppError(409, "ATTENDANCE_SESSION_LOCKED", "Only draft attendance sessions can be submitted.");
      }

      const unmarkedCount = await transaction.attendanceRecord.count({ where: { attendanceSessionId: id, status: "UNMARKED" } });
      const recordCount = await transaction.attendanceRecord.count({ where: { attendanceSessionId: id } });
      if (recordCount === 0 || unmarkedCount > 0) {
        throw new AppError(409, "ATTENDANCE_NOT_COMPLETE", "Every attendance record must be marked before submission.");
      }

      const submittedAt = new Date();
      const updated = await transaction.attendanceSession.updateMany({
        where: { id, status: "DRAFT" },
        data: { status: "SUBMITTED", submittedAt }
      });
      if (updated.count !== 1) throw new AppError(409, "ATTENDANCE_SESSION_LOCKED", "Only draft attendance sessions can be submitted.");

      await createAuditLog(transaction, {
        actorUserId: user.id,
        action: "SUBMIT",
        entityType: "ATTENDANCE_SESSION",
        entityId: id,
        oldValue: { status: "DRAFT" },
        newValue: { status: "SUBMITTED", submittedAt }
      });
      return { id, status: "SUBMITTED", submittedAt };
    }, { timeout: 15000, isolationLevel: "Serializable" });
  } catch (error) {
    if (error.code === "P2034") throw new AppError(409, "ATTENDANCE_SESSION_CONFLICT", "The attendance session changed during submission. Please retry.");
    throw error;
  }
}

export async function listStudentAttendance(query, user) {
  const records = await prisma.attendanceRecord.findMany({
    where: { student: { userId: user.id }, attendanceSession: { status: "SUBMITTED" } },
    select: {
      status: true,
      attendanceSession: {
        select: {
          subjectOfferingId: true,
          subjectOffering: {
            select: { subject: { select: { code: true, name: true } } }
          }
        }
      }
    }
  });
  const listWhere = {
    student: { userId: user.id },
    attendanceSession: { status: "SUBMITTED" },
    ...(query.status && { status: query.status })
  };
  const [totalItems, items] = await prisma.$transaction([
    prisma.attendanceRecord.count({ where: listWhere }),
    prisma.attendanceRecord.findMany({
      where: listWhere,
      select: {
        ...recordSelect,
        attendanceSession: {
          select: {
            id: true,
            sessionDate: true,
            period: true,
            subjectOffering: {
              select: {
                id: true,
                subject: { select: { code: true, name: true } },
                section: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: [{ attendanceSession: { sessionDate: "desc" } }, { id: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })
  ]);
  const subjects = [...groupByOffering(records)].map(([subjectOfferingId, offeringRecords]) => {
    const summary = summarizeRecords(offeringRecords);
    const offering = offeringRecords[0].attendanceSession.subjectOffering;
    return {
      subjectOfferingId,
      subjectCode: offering.subject.code,
      subjectName: offering.subject.name,
      ...summary,
      conducted: summary.totalSessions,
      percentage: summary.attendancePercentage
    };
  });
  subjects.sort((left, right) => left.subjectCode.localeCompare(right.subjectCode));
  return {
    overall: summarizeRecords(records),
    subjects,
    threshold: env.LOW_ATTENDANCE_THRESHOLD,
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit)
    }
  };
}

export async function listStudentAttendanceHistory(query, user) {
  const dateFilter = {
    ...(query.from && { gte: parseSessionDate(query.from) }),
    ...(query.to && { lte: parseSessionDate(query.to) })
  };
  if (query.from && query.to && dateFilter.gte > dateFilter.lte) {
    throw new AppError(422, "INVALID_DATE_RANGE", "from must be before or equal to to.");
  }
  const where = {
    student: { userId: user.id },
    attendanceSession: {
      status: "SUBMITTED",
      ...(query.subjectOfferingId && { subjectOfferingId: query.subjectOfferingId }),
      ...(Object.keys(dateFilter).length > 0 && { sessionDate: dateFilter })
    }
  };
  const [totalItems, items] = await prisma.$transaction([
    prisma.attendanceRecord.count({ where }),
    prisma.attendanceRecord.findMany({
      where,
      select: {
        id: true,
        status: true,
        markedAt: true,
        attendanceSession: {
          select: {
            id: true,
            sessionDate: true,
            period: true,
            subjectOffering: {
              select: {
                id: true,
                subject: { select: { code: true, name: true } },
                section: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: [{ attendanceSession: { sessionDate: "desc" } }, { id: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })
  ]);
  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit)
    }
  };
}
