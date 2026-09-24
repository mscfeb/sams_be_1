import { z } from "zod";

export const resourceIdSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
});
