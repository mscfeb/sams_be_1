import { Router } from "express";
import * as controller from "./report.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { lowAttendanceSchema } from "./report.schemas.js";

const router = Router();

router.get("/low-attendance", authenticate, requireRole("ADMIN", "FACULTY"), validate(lowAttendanceSchema), controller.lowAttendance);

export default router;
