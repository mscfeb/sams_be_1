import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./src/config/env.js";

import authRoutes from "./src/modules/auth/auth.routes.js";
import academicRoutes from "./src/modules/academic/academic.routes.js";
import attendanceRoutes, {
  studentAttendanceRouter
} from "./src/modules/attendance/attendance.routes.js";
import correctionRoutes from "./src/modules/corrections/correction.routes.js";
import reportRoutes from "./src/modules/reports/report.routes.js";
import dashboardRoutes from "./src/modules/dashboard/dashboard.routes.js";

import { errorMiddleware } from "./src/middleware/error.middleware.js";
import { notFoundMiddleware } from "./src/middleware/not-found.middleware.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN
  })
);

app.use(express.json({ limit: "100kb" }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/health", (_request, response) => {
  response.json({
    success: true,
    data: {
      status: "ok"
    }
  });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", academicRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1", studentAttendanceRouter);
app.use("/api/v1/corrections", correctionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

app.use(notFoundMiddleware);
app.use(errorMiddleware);

/*
|--------------------------------------------------------------------------
| Local Development
|--------------------------------------------------------------------------
|
| Vercel imports this file and uses the exported Express app.
| We only start the HTTP server when this file is executed directly.
|
*/

const isMainModule =
  process.argv[1] &&
  new URL(`file://${process.argv[1]}`).href === import.meta.url;

if (isMainModule) {
  const server = app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });

  server.on("error", (error) => {
    console.error("Backend failed to start:", error);
    process.exitCode = 1;
  });

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down.`);

    server.close(async () => {
      try {
        // If you have Prisma disconnect logic, use it here.
        // Example:
        // await prisma.$disconnect();

        console.log("Server closed.");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

/*
|--------------------------------------------------------------------------
| Vercel / Express Export
|--------------------------------------------------------------------------
*/

export default app;