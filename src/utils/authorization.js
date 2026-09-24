import { AppError } from "./errors.js";
import prisma from "../lib/prisma.js";

const forbidden = () => new AppError(403, "FORBIDDEN", "You do not have permission to access this resource.");

function assertRole(user, role) {
  if (!user || user.role !== role) {
    throw forbidden();
  }
}

export function assertAdmin(user) {
  assertRole(user, "ADMIN");
}

export async function assertSubjectOfferingAccess(user, subjectOfferingId) {
  if (user.role === "ADMIN") {
    return prisma.subjectOffering.findUnique({
      where: { id: subjectOfferingId },
      select: { id: true, subjectId: true, facultyId: true, sectionId: true }
    }).then((offering) => {
      if (!offering) throw new AppError(404, "RESOURCE_NOT_FOUND", "Subject offering not found.");
      return offering;
    });
  }

  if (user.role === "FACULTY") {
    const offering = await prisma.subjectOffering.findFirst({
      where: { id: subjectOfferingId, faculty: { userId: user.id } },
      select: { id: true, subjectId: true, facultyId: true, sectionId: true }
    });
    if (!offering) throw forbidden();
    return offering;
  }

  if (user.role === "STUDENT") {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        subjectOfferingId,
        status: "ACTIVE",
        student: { userId: user.id }
      },
      select: { subjectOffering: { select: { id: true, subjectId: true, facultyId: true, sectionId: true } } }
    });
    if (!enrollment) throw forbidden();
    return enrollment.subjectOffering;
  }

  throw forbidden();
}

export async function assertFacultyOwnsAttendanceSession(user, attendanceSessionId) {
  if (user.role === "ADMIN") {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: attendanceSessionId },
      select: { id: true, subjectOfferingId: true, status: true }
    });
    if (!session) throw new AppError(404, "RESOURCE_NOT_FOUND", "Attendance session not found.");
    return session;
  }

  assertRole(user, "FACULTY");
  const session = await prisma.attendanceSession.findFirst({
    where: {
      id: attendanceSessionId,
      subjectOffering: { faculty: { userId: user.id } }
    },
    select: { id: true, subjectOfferingId: true, status: true }
  });
  if (!session) throw forbidden();
  return session;
}

export async function assertStudentOwnsStudent(user, studentId) {
  if (user.role === "ADMIN") {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true, studentNumber: true, firstName: true, lastName: true }
    });
    if (!student) throw new AppError(404, "RESOURCE_NOT_FOUND", "Student not found.");
    return student;
  }

  assertRole(user, "STUDENT");
  const student = await prisma.student.findFirst({
    where: { id: studentId, userId: user.id },
    select: { id: true, userId: true, studentNumber: true, firstName: true, lastName: true }
  });
  if (!student) throw forbidden();
  return student;
}

export async function assertStudentOwnsAttendanceRecord(user, attendanceRecordId) {
  if (user.role === "ADMIN") {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceRecordId },
      select: { id: true, studentId: true, attendanceSessionId: true, status: true }
    });
    if (!record) throw new AppError(404, "RESOURCE_NOT_FOUND", "Attendance record not found.");
    return record;
  }

  assertRole(user, "STUDENT");
  const record = await prisma.attendanceRecord.findFirst({
    where: { id: attendanceRecordId, student: { userId: user.id } },
    select: { id: true, studentId: true, attendanceSessionId: true, status: true }
  });
  if (!record) throw forbidden();
  return record;
}
