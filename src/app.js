import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import academicRoutes from "./modules/academic/academic.routes.js";
import attendanceRoutes, { studentAttendanceRouter } from "./modules/attendance/attendance.routes.js";
import correctionRoutes from "./modules/corrections/correction.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";

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
