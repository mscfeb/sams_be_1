import { Router } from "express";
import * as authController from "./auth.controller.js";
import * as accessController from "./access.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import {
	authorizeAttendanceRecord,
	authorizeAttendanceSession,
	authorizeStudent,
	authorizeSubjectOffering
} from "../../middleware/resource-auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { loginSchema } from "./auth.schemas.js";
import { resourceIdSchema } from "./access.schemas.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/demo-login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.getCurrentUser);

router.get("/test/admin", authenticate, requireRole("ADMIN"), authController.testRole);
router.get("/test/faculty", authenticate, requireRole("FACULTY"), authController.testRole);
router.get("/test/student", authenticate, requireRole("STUDENT"), authController.testRole);

router.get(
	"/access/offerings/:id",
	authenticate,
	validate(resourceIdSchema),
	authorizeSubjectOffering,
	accessController.returnAuthorizedResource
);
router.get(
	"/access/sessions/:id",
	authenticate,
	validate(resourceIdSchema),
	authorizeAttendanceSession,
	accessController.returnAuthorizedResource
);
router.get(
	"/access/students/:id",
	authenticate,
	validate(resourceIdSchema),
	authorizeStudent,
	accessController.returnAuthorizedResource
);
router.get(
	"/access/records/:id",
	authenticate,
	validate(resourceIdSchema),
	authorizeAttendanceRecord,
	accessController.returnAuthorizedResource
);

export default router;
