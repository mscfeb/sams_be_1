import { Router } from "express";
import * as controller from "./academic.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { schemas } from "./academic.schemas.js";

const router = Router();
const admin = [authenticate, requireRole("ADMIN")];

function resourceRoutes(path, resource) {
  const resourceSchemas = schemas[resource];
  router.get(`/${path}`, ...admin, validate(resourceSchemas.list), controller.list(resource));
  router.get(`/${path}/:id`, ...admin, validate(schemas.resourceId), controller.get(resource));
  router.post(`/${path}`, ...admin, validate(resourceSchemas.create), controller.create(resource));
  router.patch(`/${path}/:id`, ...admin, validate(resourceSchemas.update), controller.update(resource));
  router.delete(`/${path}/:id`, ...admin, validate(schemas.resourceId), controller.remove(resource));
}

resourceRoutes("departments", "departments");
resourceRoutes("academic-years", "academicYears");
resourceRoutes("sections", "sections");
resourceRoutes("students", "students");
resourceRoutes("faculty", "faculty");
resourceRoutes("subjects", "subjects");
resourceRoutes("subject-offerings", "subjectOfferings");
resourceRoutes("enrollments", "enrollments");

export default router;
