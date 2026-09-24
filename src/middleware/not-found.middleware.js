import { AppError } from "../utils/errors.js";

export function notFoundMiddleware(_request, _response, next) {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
}
