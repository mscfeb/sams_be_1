import * as authService from "./auth.service.js";
import { successResponse } from "../../utils/response.js";

export async function login(request, response) {
  const result = await authService.login(request.body.role);
  return response.status(200).json(successResponse(result));
}

export async function getCurrentUser(request, response) {
  const result = await authService.getCurrentUser(request.user.id);
  return response.status(200).json(successResponse(result));
}

export function testRole(request, response) {
  return response.status(200).json(successResponse({ role: request.user.role }));
}
