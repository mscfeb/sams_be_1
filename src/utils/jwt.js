import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken({ id, role }) {
  return jwt.sign(
    { sub: id, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
