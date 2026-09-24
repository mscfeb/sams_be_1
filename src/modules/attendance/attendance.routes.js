import { Router } from "express";
import * as controller from "./attendance.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createSessionSchema,
  listSessionsSchema,
  resourceIdSchema,
  updateRecordSchema,
  listStudentAttendanceSchema,
  studentAttendanceHistorySchema
} from "./attendance.schemas.js";

const router = Router();
export const studentAttendanceRouter = Router();

router.post("/sessions", authenticate, requireRole("FACULTY"), validate(createSessionSchema), controller.createSession);
router.get("/sessions", authenticate, requireRole("ADMIN", "FACULTY"), validate(listSessionsSchema), controller.listSessions);
router.get("/sessions/:id", authenticate, requireRole("ADMIN", "FACULTY"), validate(resourceIdSchema), controller.getSession);
router.get("/sessions/:id/records", authenticate, requireRole("ADMIN", "FACULTY"), validate(resourceIdSchema), controller.listRecords);
router.patch("/records/:id", authenticate, requireRole("FACULTY"), validate(updateRecordSchema), controller.updateRecord);
router.post("/sessions/:id/submit", authenticate, requireRole("FACULTY"), validate(resourceIdSchema), controller.submitSession);
studentAttendanceRouter.get("/students/me/attendance", authenticate, requireRole("STUDENT"), validate(listStudentAttendanceSchema), controller.listStudentAttendance);
studentAttendanceRouter.get("/students/me/attendance/history", authenticate, requireRole("STUDENT"), validate(studentAttendanceHistorySchema), controller.listStudentAttendanceHistory);

export default router;
