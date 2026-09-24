import { z } from "zod";

const uuid = z.string().uuid();
const date = z.coerce.date();
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const resourceIdSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({ id: uuid }),
  query: z.object({})
});

export const listSchema = (filters = {}) => z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: z.object({ page, limit, search: z.string().trim().optional(), ...filters })
});

const departmentFields = { code: z.string().trim().min(1).max(30), name: z.string().trim().min(1).max(150) };
const academicYearFields = { name: z.string().trim().min(1).max(30), startDate: date, endDate: date, isActive: z.boolean().optional() };
const sectionFields = { name: z.string().trim().min(1).max(80), program: z.string().trim().min(1).max(150), semester: z.number().int().min(1), departmentId: uuid, academicYearId: uuid };
const personFields = { email: z.string().email(), firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), departmentId: uuid };
const studentFields = { ...personFields, studentNumber: z.string().trim().min(1).max(40), sectionId: uuid };
const facultyFields = { ...personFields, employeeNumber: z.string().trim().min(1).max(40) };
const subjectFields = { code: z.string().trim().min(1).max(40), name: z.string().trim().min(1).max(150), credits: z.number().int().min(1).max(20), departmentId: uuid };
const offeringFields = { subjectId: uuid, facultyId: uuid, sectionId: uuid, academicYearId: uuid, semester: z.number().int().min(1) };
const enrollmentFields = { studentId: uuid, subjectOfferingId: uuid, status: z.enum(["ACTIVE", "DROPPED", "COMPLETED"]).default("ACTIVE") };

function bodySchema(fields) {
  return z.object({ body: z.object(fields), params: z.object({}), query: z.object({}) });
}

function patchSchema(fields) {
  return z.object({
    body: z.object(fields).partial().refine((body) => Object.keys(body).length > 0, "At least one field is required."),
    params: z.object({ id: uuid }),
    query: z.object({})
  });
}

export const schemas = {
  resourceId: resourceIdSchema,
  departments: { create: bodySchema(departmentFields), update: patchSchema(departmentFields), list: listSchema() },
  academicYears: { create: bodySchema(academicYearFields), update: patchSchema(academicYearFields), list: listSchema() },
  sections: { create: bodySchema(sectionFields), update: patchSchema(sectionFields), list: listSchema({ departmentId: uuid.optional(), academicYearId: uuid.optional() }) },
  students: { create: bodySchema(studentFields), update: patchSchema(studentFields), list: listSchema({ departmentId: uuid.optional(), sectionId: uuid.optional() }) },
  faculty: { create: bodySchema(facultyFields), update: patchSchema(facultyFields), list: listSchema({ departmentId: uuid.optional() }) },
  subjects: { create: bodySchema(subjectFields), update: patchSchema(subjectFields), list: listSchema({ departmentId: uuid.optional() }) },
  subjectOfferings: { create: bodySchema(offeringFields), update: patchSchema(offeringFields), list: listSchema({ subjectId: uuid.optional(), facultyId: uuid.optional(), sectionId: uuid.optional(), academicYearId: uuid.optional() }) },
  enrollments: { create: bodySchema(enrollmentFields), update: patchSchema(enrollmentFields), list: listSchema({ studentId: uuid.optional(), subjectOfferingId: uuid.optional(), status: z.enum(["ACTIVE", "DROPPED", "COMPLETED"]).optional() }) }
};

export function validateDateRange(data) {
  return data.startDate < data.endDate;
}
