import * as reportService from "./report.service.js";
import { successResponse } from "../../utils/response.js";

export async function lowAttendance(request, response) {
  const result = await reportService.lowAttendance(request.validated.query, request.user);
  return response.status(200).json(successResponse(result));
}
