import { z } from "zod";

export const dashboardSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(20).default(10)
  })
});
