import { z } from "zod";

const uuid = z.string().uuid();
const status = z.enum(["PRESENT", "ABSENT", "LATE"]);
const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const createCorrectionSchema = z.object({
  body: z.object({
    attendanceRecordId: uuid.optional(),
    attendanceSessionId: uuid.optional(),
    studentNumber: z.string().trim().min(1).max(40).optional(),
    newStatus: status,
    reason: z.string().trim().min(1).max(1000)
  }).refine((body) => body.attendanceRecordId || (body.attendanceSessionId && body.studentNumber), {
    message: "Provide attendanceRecordId or attendanceSessionId with studentNumber."
  }),
  params: z.object({}),
  query: z.object({})
});

export const listCorrectionsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: pagination.extend({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    facultyId: uuid.optional(),
    subjectOfferingId: uuid.optional()
  })
});

export const reviewCorrectionSchema = z.object({
  // body: z.object({}),
  params: z.object({ id: uuid }),
  // query: z.object({})
});
