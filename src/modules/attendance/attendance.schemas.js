import { z } from "zod";

const uuid = z.string().uuid();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sessionDate must use YYYY-MM-DD format.");
const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const createSessionSchema = z.object({
  body: z.object({
    subjectOfferingId: uuid,
    sessionDate: dateString,
    period: z.coerce.number().int().positive()
  }),
  params: z.object({}),
  query: z.object({})
});

export const listSessionsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: pagination.extend({
    subjectOfferingId: uuid.optional(),
    date: dateString.optional(),
    status: z.enum(["DRAFT", "SUBMITTED"]).optional()
  })
});

export const resourceIdSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({ id: uuid }),
  query: z.object({})
});

export const updateRecordSchema = z.object({
  body: z.object({
    status: z.enum(["PRESENT", "ABSENT", "LATE"])
  }),
  params: z.object({ id: uuid }),
  query: z.object({})
});

export const listStudentAttendanceSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: pagination.extend({
    status: z.enum(["UNMARKED", "PRESENT", "ABSENT", "LATE"]).optional()
  })
});

export const studentAttendanceHistorySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: pagination.extend({
    subjectOfferingId: uuid.optional(),
    from: dateString.optional(),
    to: dateString.optional()
  })
});
