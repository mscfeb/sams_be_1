import prisma from "../src/lib/prisma.js";

const id = (number) => `00000000-0000-0000-0000-${number.toString().padStart(12, "0")}`;
const date = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

const departments = [
  { id: id(1), code: "CSE", name: "Computer Science and Engineering" },
  { id: id(2), code: "ISE", name: "Information Science and Engineering" },
  { id: id(3), code: "ECE", name: "Electronics and Communication Engineering" }
];

const sections = [
  { id: id(20), name: "CSE-A", program: "B.E. Computer Science", semester: 5, departmentId: id(1) },
  { id: id(21), name: "CSE-B", program: "B.E. Computer Science", semester: 5, departmentId: id(1) },
  { id: id(22), name: "ISE-A", program: "B.E. Information Science", semester: 5, departmentId: id(2) },
  { id: id(23), name: "ECE-A", program: "B.E. Electronics and Communication", semester: 5, departmentId: id(3) }
];

const subjects = [
  { id: id(30), code: "CS301", name: "Database Management Systems", credits: 4, departmentId: id(1) },
  { id: id(31), code: "CS302", name: "Operating Systems", credits: 4, departmentId: id(1) },
  { id: id(32), code: "CS303", name: "Computer Networks", credits: 3, departmentId: id(1) },
  { id: id(33), code: "CS304", name: "Web Technologies", credits: 3, departmentId: id(1) },
  { id: id(34), code: "CS305", name: "Software Engineering", credits: 3, departmentId: id(1) },
  { id: id(35), code: "IS301", name: "Data Mining", credits: 4, departmentId: id(2) },
  { id: id(36), code: "IS302", name: "Cloud Computing", credits: 3, departmentId: id(2) },
  { id: id(37), code: "IS303", name: "Information Security", credits: 3, departmentId: id(2) },
  { id: id(38), code: "EC301", name: "Digital Signal Processing", credits: 4, departmentId: id(3) },
  { id: id(39), code: "EC302", name: "Embedded Systems", credits: 4, departmentId: id(3) }
];

const faculty = Array.from({ length: 5 }, (_, index) => ({
  user: {
    id: id(100 + index),
    email: `faculty${index + 1}@example.com`,
    role: "FACULTY"
  },
  profile: {
    id: id(110 + index),
    userId: id(100 + index),
    employeeNumber: `EMP${String(index + 1).padStart(3, "0")}`,
    firstName: ["Ravi", "Priya", "Anil", "Meera", "Kiran"][index],
    lastName: ["Kumar", "Shah", "Rao", "Nair", "Patel"][index],
    departmentId: departments[index % departments.length].id
  }
}));

const students = Array.from({ length: 50 }, (_, index) => {
  const section = sections[index % sections.length];
  return {
    user: {
      id: id(200 + index),
      email: `student${String(index + 1).padStart(2, "0")}@example.com`,
      role: "STUDENT"
    },
    profile: {
      id: id(300 + index),
      userId: id(200 + index),
      studentNumber: `STU${String(index + 1).padStart(3, "0")}`,
      firstName: `Student${index + 1}`,
      lastName: "Demo",
      departmentId: section.departmentId,
      sectionId: section.id
    }
  };
});

async function upsertUser(user) {
  return prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email, role: user.role, isActive: true },
    create: user
  });
}

async function seedAcademicStructure(academicYearId) {
  for (const department of departments) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: department,
      create: department
    });
  }

  await prisma.academicYear.upsert({
    where: { id: academicYearId },
    update: { name: "2026-27", startDate: date(2026, 8, 1), endDate: date(2027, 7, 31), isActive: true },
    create: { id: academicYearId, name: "2026-27", startDate: date(2026, 8, 1), endDate: date(2027, 7, 31) }
  });

  for (const section of sections) {
    await prisma.section.upsert({
      where: { id: section.id },
      update: { ...section, academicYearId },
      create: { ...section, academicYearId }
    });
  }

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { id: subject.id },
      update: subject,
      create: subject
    });
  }
}

async function seedPeople() {
  await upsertUser({ id: id(90), email: "admin@example.com", role: "ADMIN" });

  for (const person of faculty) {
    await upsertUser(person.user);
    await prisma.faculty.upsert({
      where: { id: person.profile.id },
      update: person.profile,
      create: person.profile
    });
  }

  for (const person of students) {
    await upsertUser(person.user);
    await prisma.student.upsert({
      where: { id: person.profile.id },
      update: person.profile,
      create: person.profile
    });
  }
}

async function seedOfferings(academicYearId) {
  const offerings = subjects.map((subject, index) => ({
    id: id(400 + index),
    subjectId: subject.id,
    facultyId: faculty[index % faculty.length].profile.id,
    sectionId: sections[index % sections.length].id,
    academicYearId,
    semester: 5
  }));

  for (const offering of offerings) {
    await prisma.subjectOffering.upsert({
      where: { id: offering.id },
      update: offering,
      create: offering
    });
  }

  for (const offering of offerings) {
    const sectionStudents = students.filter((student) => student.profile.sectionId === offering.sectionId);
    for (const student of sectionStudents) {
      await prisma.enrollment.upsert({
        where: {
          studentId_subjectOfferingId: {
            studentId: student.profile.id,
            subjectOfferingId: offering.id
          }
        },
        update: { status: "ACTIVE" },
        create: {
          studentId: student.profile.id,
          subjectOfferingId: offering.id,
          status: "ACTIVE"
        }
      });
    }
  }

  return offerings;
}

async function seedAttendance(offering, facultyUserId) {
  const enrolledStudents = await prisma.enrollment.findMany({
    where: { subjectOfferingId: offering.id },
    select: { studentId: true },
    orderBy: { studentId: "asc" }
  });

  for (let sessionIndex = 0; sessionIndex < 25; sessionIndex += 1) {
    const sessionId = id(500 + sessionIndex);
    await prisma.attendanceSession.upsert({
      where: { id: sessionId },
      update: {
        subjectOfferingId: offering.id,
        sessionDate: date(2026, 8, 3 + sessionIndex),
        period: 1,
        status: "SUBMITTED",
        createdById: facultyUserId,
        submittedAt: date(2026, 8, 3 + sessionIndex)
      },
      create: {
        id: sessionId,
        subjectOfferingId: offering.id,
        sessionDate: date(2026, 8, 3 + sessionIndex),
        period: 1,
        status: "SUBMITTED",
        createdById: facultyUserId,
        submittedAt: date(2026, 8, 3 + sessionIndex)
      }
    });

    for (let studentIndex = 0; studentIndex < enrolledStudents.length; studentIndex += 1) {
      const studentId = enrolledStudents[studentIndex].studentId;
      const status = studentIndex === 0 && sessionIndex >= 22
        ? "ABSENT"
        : studentIndex === 1 && sessionIndex >= 17
          ? "ABSENT"
          : "PRESENT";
      const recordId = id(1000 + sessionIndex * 50 + studentIndex);

      await prisma.attendanceRecord.upsert({
        where: { id: recordId },
        update: { attendanceSessionId: sessionId, studentId, status, markedById: facultyUserId },
        create: { id: recordId, attendanceSessionId: sessionId, studentId, status, markedById: facultyUserId }
      });
    }
  }

  const draftSessionId = id(530);
  await prisma.attendanceSession.upsert({
    where: { id: draftSessionId },
    update: {
      subjectOfferingId: offering.id,
      sessionDate: date(2026, 9, 1),
      period: 1,
      status: "DRAFT",
      createdById: facultyUserId,
      submittedAt: null
    },
    create: {
      id: draftSessionId,
      subjectOfferingId: offering.id,
      sessionDate: date(2026, 9, 1),
      period: 1,
      status: "DRAFT",
      createdById: facultyUserId
    }
  });

  for (let studentIndex = 0; studentIndex < enrolledStudents.length; studentIndex += 1) {
    await prisma.attendanceRecord.upsert({
      where: { id: id(3000 + studentIndex) },
      update: {
        attendanceSessionId: draftSessionId,
        studentId: enrolledStudents[studentIndex].studentId,
        status: "UNMARKED",
        markedById: facultyUserId
      },
      create: {
        id: id(3000 + studentIndex),
        attendanceSessionId: draftSessionId,
        studentId: enrolledStudents[studentIndex].studentId,
        status: "UNMARKED",
        markedById: facultyUserId
      }
    });
  }

  const correctionRecordId = id(1000 + 17 * 50 + 1);
  await prisma.correctionRequest.upsert({
    where: { id: id(4000) },
    update: {
      attendanceRecordId: correctionRecordId,
      requestedById: facultyUserId,
      oldStatus: "ABSENT",
      newStatus: "PRESENT",
      reason: "Student submitted approved supporting documentation.",
      status: "PENDING",
      reviewedById: null,
      reviewedAt: null
    },
    create: {
      id: id(4000),
      attendanceRecordId: correctionRecordId,
      requestedById: facultyUserId,
      oldStatus: "ABSENT",
      newStatus: "PRESENT",
      reason: "Student submitted approved supporting documentation.",
      status: "PENDING"
    }
  });
}

async function seedAuditLog() {
  await prisma.auditLog.upsert({
    where: { id: id(5000) },
    update: {
      userId: id(90),
      action: "SEED_INITIALIZED",
      entityType: "SYSTEM",
      entityId: id(90),
      oldValue: null,
      newValue: { source: "development-seed" }
    },
    create: {
      id: id(5000),
      userId: id(90),
      action: "SEED_INITIALIZED",
      entityType: "SYSTEM",
      entityId: id(90),
      newValue: { source: "development-seed" }
    }
  });
}

async function main() {
  const academicYearId = id(10);
  await seedAcademicStructure(academicYearId);
  await seedPeople();
  const offerings = await seedOfferings(academicYearId);
  await seedAttendance(offerings[0], faculty[0].user.id);
  await seedAuditLog();
  console.log("Development database seeded successfully.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
