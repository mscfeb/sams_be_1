import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    role: z.enum(["ADMIN", "FACULTY", "STUDENT"])
  }),
  params: z.object({}),
  query: z.object({})
});
