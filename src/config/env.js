import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().min(1).default("1h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOW_ATTENDANCE_THRESHOLD: z.coerce.number().min(0).max(100).default(75)
});

export const env = envSchema.parse(process.env);
