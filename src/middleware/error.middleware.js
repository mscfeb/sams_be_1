import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { errorResponse } from "../utils/response.js";

export function errorMiddleware(error, _request, response, _next) {
  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join(".") || "request", issue.message])
    );
    return response.status(422).json(errorResponse(
      "VALIDATION_ERROR",
      "Request validation failed.",
      fields
    ));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return response.status(409).json(errorResponse(
        "DUPLICATE_RESOURCE",
        "A resource with the same unique value already exists."
      ));
    }

    if (error.code === "P2025") {
      return response.status(404).json(errorResponse("RESOURCE_NOT_FOUND", "Resource not found."));
    }
  }

  if (error.statusCode) {
    return response.status(error.statusCode).json(errorResponse(
      error.code,
      error.message,
      error.details
    ));
  }

  logger.error("Unhandled server error", error);
  return response.status(500).json(errorResponse(
    "INTERNAL_SERVER_ERROR",
    env.NODE_ENV === "production" ? "An unexpected error occurred." : error.message
  ));
}
