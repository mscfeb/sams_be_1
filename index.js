import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./src/config/env.js";
import authRoutes from "./src/modules/auth/auth.routes.js";
import academicRoutes from "./src/modules/academic/academic.routes.js";
import attendanceRoutes, { studentAttendanceRouter } from "./src/modules/attendance/attendance.routes.js";
import correctionRoutes from "./src/modules/corrections/correction.routes.js";
import reportRoutes from "./src/modules/reports/report.routes.js";
import dashboardRoutes from "./src/modules/dashboard/dashboard.routes.js";
import { errorMiddleware } from "./src/middleware/error.middleware.js";
import { notFoundMiddleware } from "./src/middleware/not-found.middleware.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_request, response) => {
  response.json({
    success: true,
    data: {
      status: "ok"
    }
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", academicRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1", studentAttendanceRouter);
app.use("/api/v1/corrections", correctionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);


app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});

app.on("error", (error) => {
  console.error("Backend failed to start", error);
  process.exitCode = 1;
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down.`);
  app.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));