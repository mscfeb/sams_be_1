import { Router } from "express";
import * as controller from "./dashboard.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { dashboardSchema } from "./dashboard.schemas.js";

const router = Router();

router.get("/admin", authenticate, requireRole("ADMIN"), validate(dashboardSchema), controller.adminDashboard);
router.get("/faculty", authenticate, requireRole("FACULTY"), validate(dashboardSchema), controller.facultyDashboard);
router.get("/student", authenticate, requireRole("STUDENT"), validate(dashboardSchema), controller.studentDashboard);

export default router;
