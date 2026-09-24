import { Router } from "express";
import * as controller from "./correction.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createCorrectionSchema, listCorrectionsSchema, reviewCorrectionSchema } from "./correction.schemas.js";

const router = Router();

router.post("/", authenticate, requireRole("FACULTY"), validate(createCorrectionSchema), controller.createCorrection);
router.get("/", authenticate, requireRole("ADMIN", "FACULTY"), validate(listCorrectionsSchema), controller.listCorrections);
router.post("/:id/approve", authenticate, requireRole("ADMIN"), validate(reviewCorrectionSchema), controller.approveCorrection);
router.post("/:id/reject", authenticate, requireRole("ADMIN"), validate(reviewCorrectionSchema), controller.rejectCorrection);

export default router;
