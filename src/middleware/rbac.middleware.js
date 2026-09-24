import { AppError } from "../utils/errors.js";

export function requireRole(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.user) {
      return next(new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."));
    }

    if (!allowedRoles.includes(request.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "You do not have permission to access this resource."));
    }

    return next();
  };
}
