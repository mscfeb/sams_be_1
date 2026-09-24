import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authenticate(request, _response, next) {
  const authorization = request.get("Authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."));
  }

  try {
    const decoded = verifyAccessToken(token);
    if (typeof decoded !== "object" || typeof decoded.sub !== "string" || typeof decoded.role !== "string") {
      throw new Error("Invalid token claims");
    }
console.log(decoded,'decoded')
    request.user = { id: decoded.sub, role: decoded.role };
    return next();
  } catch (_error) {
    return next(new AppError(401, "INVALID_TOKEN", "The authentication token is invalid or expired."));
  }
}
