import { z } from "zod";

const uuid = z.string().uuid();
const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const lowAttendanceSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: pagination.extend({
    threshold: z.coerce.number().min(0).max(100).default(75),
    subjectOfferingId: uuid.optional(),
    sectionId: uuid.optional(),
    departmentId: uuid.optional()
  })
});
