import prisma from "../../lib/prisma.js";
import { createAuditLog } from "../audit/audit.service.js";
import { AppError } from "../../utils/errors.js";

const correctionSelect = {
  id: true,
  attendanceRecordId: true,
  requestedById: true,
  oldStatus: true,
  newStatus: true,
  reason: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true
};

const correctionResponseSelect = {
  id: true,
  oldStatus: true,
  newStatus: true,
  reason: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
  attendanceRecord: {
    select: {
      student: { select: { studentNumber: true, firstName: true, lastName: true } },
      attendanceSession: {
        select: {
          sessionDate: true,
          period: true,
          subjectOffering: { select: { subject: { select: { code: true } } } }
        }
      }
    }
  }
};

function notFound() {
  return new AppError(404, "CORRECTION_NOT_FOUND", "Correction request not found.");
}

function forbidden() {
  return new AppError(403, "CORRECTION_NOT_AUTHORIZED", "You do not have permission to access this correction request.");
}

function pendingError() {
  return new AppError(409, "CORRECTION_ALREADY_PENDING", "A correction request is already pending for this attendance record.");
}

function notPending() {
  return new AppError(409, "CORRECTION_NOT_PENDING", "Only pending correction requests can be reviewed.");
}

export async function createCorrection(input, user) {
  return prisma.$transaction(async (transaction) => {
    const recordWhere = input.attendanceRecordId
      ? { id: input.attendanceRecordId }
      : {
        attendanceSessionId: input.attendanceSessionId,
        student: { studentNumber: input.studentNumber }
      };
    const record = await transaction.attendanceRecord.findFirst({
      where: {
        ...recordWhere,
        attendanceSession: {
          status: "SUBMITTED",
          subjectOffering: { faculty: { userId: user.id } }
        }
      },
      select: { id: true, status: true }
    });
    if (!record) throw forbidden();
    if (record.status === input.newStatus) {
      throw new AppError(422, "CORRECTION_STATUS_UNCHANGED", "The requested status must differ from the current status.");
    }

    const existing = await transaction.correctionRequest.findFirst({
      where: { attendanceRecordId: record.id, status: "PENDING" },
      select: { id: true }
    });
    if (existing) throw pendingError();

    const correction = await transaction.correctionRequest.create({
      data: {
        attendanceRecordId: record.id,
        requestedById: user.id,
        oldStatus: record.status,
        newStatus: input.newStatus,
        reason: input.reason,
        status: "PENDING"
      },
      select: correctionResponseSelect
    });
    await createAuditLog(transaction, {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "CORRECTION_REQUEST",
      entityId: correction.id,
      newValue: { attendanceRecordId: record.id, oldStatus: record.status, newStatus: input.newStatus }
    });
    return correction;
  }, { timeout: 15000, isolationLevel: "Serializable" });
}

export async function listCorrections(query, user) {
  const where = {
    ...(query.status && { status: query.status }),
    ...(user.role === "FACULTY" && { requestedById: user.id }),
    ...(query.facultyId && { requestedBy: { faculty: { id: query.facultyId } } }),
    ...(query.subjectOfferingId && {
      attendanceRecord: { attendanceSession: { subjectOfferingId: query.subjectOfferingId } }
    })
  };
  const [totalItems, items] = await prisma.$transaction([
    prisma.correctionRequest.count({ where }),
    prisma.correctionRequest.findMany({
      where,
      select: correctionResponseSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })
  ]);
  return { items, pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) } };
}

export async function reviewCorrection(id, decision, user) {
  console.log(id,'idddddddddddddddddddddddddddddd')
  return prisma.$transaction(async (transaction) => {
    const correction = await transaction.correctionRequest.findUnique({
      where: { id },
      select: { ...correctionSelect, attendanceRecord: { select: { id: true, status: true, attendanceSession: { select: { status: true } } } } }
    });
    if (!correction) throw notFound();
    if (correction.status !== "PENDING") throw notPending();
    if (correction.attendanceRecord.attendanceSession.status !== "SUBMITTED") {
      throw new AppError(409, "ATTENDANCE_SESSION_NOT_SUBMITTED", "Corrections require a submitted attendance session.");
    }

    const claimed = await transaction.correctionRequest.updateMany({
      where: { id, status: "PENDING" },
      data: { status: decision, reviewedById: user.id, reviewedAt: new Date() }
    });
    if (claimed.count !== 1) throw notPending();

    if (decision === "APPROVED") {
      await transaction.attendanceRecord.update({
        where: { id: correction.attendanceRecordId },
        data: { status: correction.newStatus, markedById: user.id, markedAt: new Date() }
      });
    }

    const result = await transaction.correctionRequest.findUnique({ where: { id }, select: correctionResponseSelect });
    await createAuditLog(transaction, {
      actorUserId: user.id,
      action: decision === "APPROVED" ? "APPROVE" : "REJECT",
      entityType: "CORRECTION_REQUEST",
      entityId: id,
      oldValue: { status: "PENDING", attendanceStatus: correction.oldStatus },
      newValue: { status: decision, attendanceStatus: decision === "APPROVED" ? correction.newStatus : correction.oldStatus }
    });
    return result;
  }, { timeout: 15000, isolationLevel: "Serializable" });
}
