import prisma from "../../lib/prisma.js";
import { createAuditLog } from "../audit/audit.service.js";
import { AppError } from "../../utils/errors.js";

const selects = {
  department: { id: true, code: true, name: true, createdAt: true, updatedAt: true },
  academicYear: { id: true, name: true, startDate: true, endDate: true, isActive: true, createdAt: true, updatedAt: true },
  section: { id: true, name: true, program: true, semester: true, departmentId: true, academicYearId: true, department: { select: { id: true, code: true, name: true } }, academicYear: { select: { id: true, name: true } } },
  student: { id: true, userId: true, studentNumber: true, firstName: true, lastName: true, departmentId: true, sectionId: true, user: { select: { email: true, isActive: true } }, department: { select: { id: true, code: true, name: true } }, section: { select: { id: true, name: true, program: true } } },
  faculty: { id: true, userId: true, employeeNumber: true, firstName: true, lastName: true, departmentId: true, user: { select: { email: true, isActive: true } }, department: { select: { id: true, code: true, name: true } } },
  subject: { id: true, code: true, name: true, credits: true, departmentId: true, department: { select: { id: true, code: true, name: true } } },
  subjectOffering: { id: true, subjectId: true, facultyId: true, sectionId: true, academicYearId: true, semester: true, subject: { select: { id: true, code: true, name: true } }, faculty: { select: { id: true, employeeNumber: true, firstName: true, lastName: true } }, section: { select: { id: true, name: true, program: true } }, academicYear: { select: { id: true, name: true } } },
  enrollment: { id: true, studentId: true, subjectOfferingId: true, status: true, enrolledAt: true, student: { select: { id: true, studentNumber: true, firstName: true, lastName: true } }, subjectOffering: { select: { id: true, subject: { select: { code: true, name: true } } } } }
};

const configs = {
  departments: { model: "department", entity: "DEPARTMENT", select: selects.department, orderBy: [{ name: "asc" }, { id: "asc" }], search: ["code", "name"] },
  academicYears: { model: "academicYear", entity: "ACADEMIC_YEAR", select: selects.academicYear, orderBy: [{ startDate: "desc" }, { id: "asc" }], search: ["name"] },
  sections: { model: "section", entity: "SECTION", select: selects.section, orderBy: [{ name: "asc" }, { id: "asc" }], search: ["name", "program"] },
  students: { model: "student", entity: "STUDENT", select: selects.student, orderBy: [{ studentNumber: "asc" }, { id: "asc" }], search: ["studentNumber", "firstName", "lastName"] },
  faculty: { model: "faculty", entity: "FACULTY", select: selects.faculty, orderBy: [{ employeeNumber: "asc" }, { id: "asc" }], search: ["employeeNumber", "firstName", "lastName"] },
  subjects: { model: "subject", entity: "SUBJECT", select: selects.subject, orderBy: [{ code: "asc" }, { id: "asc" }], search: ["code", "name"] },
  subjectOfferings: { model: "subjectOffering", entity: "SUBJECT_OFFERING", select: selects.subjectOffering, orderBy: [{ createdAt: "desc" }, { id: "asc" }] },
  enrollments: { model: "enrollment", entity: "ENROLLMENT", select: selects.enrollment, orderBy: [{ enrolledAt: "desc" }, { id: "asc" }] }
};

const relationModels = {
  department: "department",
  academicYear: "academicYear",
  section: "section",
  student: "student",
  faculty: "faculty",
  subject: "subject",
  subjectOffering: "subjectOffering"
};

function configFor(resource) {
  const config = configs[resource];
  if (!config) throw new AppError(500, "CONFIGURATION_ERROR", "Unknown academic resource.");
  return config;
}

function searchWhere(fields, search) {
  return search ? { OR: fields.map((field) => ({ [field]: { contains: search, mode: "insensitive" } })) } : {};
}

async function requireRecord(transaction, model, id, label) {
  const record = await transaction[model].findUnique({ where: { id }, select: { id: true } });
  if (!record) throw new AppError(404, "RESOURCE_NOT_FOUND", `${label} not found.`);
  return record;
}

async function requireReferences(transaction, references) {
  for (const [model, id, label] of references) await requireRecord(transaction, model, id, label);
}

function ensureDateRange(data) {
  if (data.startDate && data.endDate && data.startDate >= data.endDate) {
    throw new AppError(422, "INVALID_DATE_RANGE", "startDate must be before endDate.");
  }
}

function auditData(actorUserId, action, entity, entityId, oldValue, newValue) {
  return { actorUserId, action, entityType: entity, entityId, oldValue, newValue };
}

function buildWhere(resource, query) {
  const { search, departmentId, academicYearId, sectionId, subjectId, facultyId, studentId, subjectOfferingId, status } = query;
  const config = configFor(resource);
  const where = { ...searchWhere(config.search ?? [], search) };
  if (["sections", "students", "faculty", "subjects"].includes(resource) && departmentId) where.departmentId = departmentId;
  if (resource === "sections" && academicYearId) where.academicYearId = academicYearId;
  if (resource === "students" && sectionId) where.sectionId = sectionId;
  if (resource === "subjectOfferings") Object.assign(where, { ...(subjectId && { subjectId }), ...(facultyId && { facultyId }), ...(sectionId && { sectionId }), ...(academicYearId && { academicYearId }) });
  if (resource === "enrollments") Object.assign(where, { ...(studentId && { studentId }), ...(subjectOfferingId && { subjectOfferingId }), ...(status && { status }) });
  return where;
}

export async function list(resource, query) {
  const config = configFor(resource);
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const where = buildWhere(resource, query);
  const [totalItems, items] = await prisma.$transaction([
    prisma[config.model].count({ where }),
    prisma[config.model].findMany({ where, select: config.select, orderBy: config.orderBy, skip: (page - 1) * limit, take: limit })
  ]);
  return { items, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } };
}

export async function get(resource, id) {
  const config = configFor(resource);
  const item = await prisma[config.model].findUnique({ where: { id }, select: config.select });
  if (!item) throw new AppError(404, "RESOURCE_NOT_FOUND", `${config.entity.replaceAll("_", " ")} not found.`);
  return item;
}

function dataFor(resource, body) {
  if (resource === "departments") return { code: body.code, name: body.name };
  if (resource === "academicYears") return { name: body.name, startDate: body.startDate, endDate: body.endDate, ...(body.isActive !== undefined && { isActive: body.isActive }) };
  if (resource === "sections") return { name: body.name, program: body.program, semester: body.semester, departmentId: body.departmentId, academicYearId: body.academicYearId };
  if (resource === "students") return { studentNumber: body.studentNumber, firstName: body.firstName, lastName: body.lastName, departmentId: body.departmentId, sectionId: body.sectionId };
  if (resource === "faculty") return { employeeNumber: body.employeeNumber, firstName: body.firstName, lastName: body.lastName, departmentId: body.departmentId };
  if (resource === "subjects") return { code: body.code, name: body.name, credits: body.credits, departmentId: body.departmentId };
  if (resource === "subjectOfferings") return { subjectId: body.subjectId, facultyId: body.facultyId, sectionId: body.sectionId, academicYearId: body.academicYearId, semester: body.semester };
  if (resource === "enrollments") return { studentId: body.studentId, subjectOfferingId: body.subjectOfferingId, status: body.status };
  throw new AppError(500, "CONFIGURATION_ERROR", "Unknown academic resource.");
}

async function validateReferences(transaction, resource, data) {
  if (resource === "sections") await requireReferences(transaction, [["department", data.departmentId, "Department"], ["academicYear", data.academicYearId, "Academic year"]]);
  if (resource === "students") await requireReferences(transaction, [["department", data.departmentId, "Department"], ["section", data.sectionId, "Section"]]);
  if (resource === "faculty") await requireReferences(transaction, [["department", data.departmentId, "Department"]]);
  if (resource === "subjects") await requireReferences(transaction, [["department", data.departmentId, "Department"]]);
  if (resource === "subjectOfferings") await requireReferences(transaction, [["subject", data.subjectId, "Subject"], ["faculty", data.facultyId, "Faculty"], ["section", data.sectionId, "Section"], ["academicYear", data.academicYearId, "Academic year"]]);
  if (resource === "enrollments") await requireReferences(transaction, [["student", data.studentId, "Student"], ["subjectOffering", data.subjectOfferingId, "Subject offering"]]);
}

export async function create(resource, body, actorUserId) {
  const config = configFor(resource);
  ensureDateRange(body);
  return prisma.$transaction(async (transaction) => {
    const data = dataFor(resource, body);
    await validateReferences(transaction, resource, data);
    let item;
    if (resource === "students" || resource === "faculty") {
      const role = resource === "students" ? "STUDENT" : "FACULTY";
      const user = await transaction.user.create({ data: { email: body.email, role }, select: { id: true } });
      item = await transaction[config.model].create({ data: { ...data, userId: user.id }, select: config.select });
    } else {
      item = await transaction[config.model].create({ data, select: config.select });
    }
    await createAuditLog(transaction, auditData(actorUserId, "CREATE", config.entity, item.id, undefined, data));
    return item;
  }, { timeout: 15000 });
}

export async function update(resource, id, body, actorUserId) {
  const config = configFor(resource);
  ensureDateRange(body);
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction[config.model].findUnique({ where: { id }, select: config.select });
    if (!existing) throw new AppError(404, "RESOURCE_NOT_FOUND", `${config.entity.replaceAll("_", " ")} not found.`);
    const data = dataFor(resource, { ...existing, ...body });
    await validateReferences(transaction, resource, data);
    let item;
    if (resource === "students" || resource === "faculty") {
      if (body.email) await transaction.user.update({ where: { id: existing.userId }, data: { email: body.email } });
      item = await transaction[config.model].update({ where: { id }, data, select: config.select });
    } else {
      item = await transaction[config.model].update({ where: { id }, data, select: config.select });
    }
    await createAuditLog(transaction, auditData(actorUserId, "UPDATE", config.entity, id, existing, data));
    return item;
  }, { timeout: 15000 });
}

export async function remove(resource, id, actorUserId) {
  const config = configFor(resource);
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction[config.model].findUnique({ where: { id }, select: config.select });
    if (!existing) throw new AppError(404, "RESOURCE_NOT_FOUND", `${config.entity.replaceAll("_", " ")} not found.`);
    if (resource === "students" || resource === "faculty") {
      await transaction.user.update({ where: { id: existing.userId }, data: { isActive: false } });
      await createAuditLog(transaction, auditData(actorUserId, "DEACTIVATE", config.entity, id, existing, { isActive: false }));
      return { id, deactivated: true };
    }
    try {
      await transaction[config.model].delete({ where: { id } });
    } catch (error) {
      if (error.code === "P2003") throw new AppError(409, "RESOURCE_IN_USE", "Resource cannot be deleted because related records exist.");
      throw error;
    }
    await createAuditLog(transaction, auditData(actorUserId, "DELETE", config.entity, id, existing, undefined));
    return { id, deleted: true };
  }, { timeout: 15000 });
}
