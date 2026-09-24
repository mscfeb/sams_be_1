import * as dashboardService from "./dashboard.service.js";
import { successResponse } from "../../utils/response.js";

export async function adminDashboard(request, response) {
  const result = await dashboardService.adminDashboard();
  return response.status(200).json(successResponse(result));
}

export async function facultyDashboard(request, response) {
  const result = await dashboardService.facultyDashboard(request.user, request.validated.query.limit);
  return response.status(200).json(successResponse(result));
}

export async function studentDashboard(request, response) {
  const result = await dashboardService.studentDashboard(request.user, request.validated.query.limit);
  return response.status(200).json(successResponse(result));
}
