import * as attendanceService from "./attendance.service.js";
import { successResponse } from "../../utils/response.js";

export async function createSession(request, response) {
  const session = await attendanceService.createSession(request.validated.body, request.user);
  return response.status(201).json(successResponse(session));
}

export async function listSessions(request, response) {
  const result = await attendanceService.listSessions(request.validated.query, request.user);
  return response.status(200).json(successResponse(result));
}

export async function getSession(request, response) {
  const session = await attendanceService.getSession(request.validated.params.id, request.user);
  return response.status(200).json(successResponse(session));
}

export async function listRecords(request, response) {
  const records = await attendanceService.listSessionRecords(request.validated.params.id, request.user);
  return response.status(200).json(successResponse(records));
}

export async function updateRecord(request, response) {
  const record = await attendanceService.updateRecord(request.validated.params.id, request.validated.body.status, request.user);
  return response.status(200).json(successResponse(record));
}

export async function submitSession(request, response) {
  const session = await attendanceService.submitSession(request.validated.params.id, request.user);
  return response.status(200).json(successResponse(session));
}

export async function listStudentAttendance(request, response) {
  const result = await attendanceService.listStudentAttendance(request.validated.query, request.user);
  return response.status(200).json(successResponse(result));
}

export async function listStudentAttendanceHistory(request, response) {
  const result = await attendanceService.listStudentAttendanceHistory(request.validated.query, request.user);
  return response.status(200).json(successResponse(result));
}
