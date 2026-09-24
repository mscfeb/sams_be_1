import * as correctionService from "./correction.service.js";
import { successResponse } from "../../utils/response.js";

export async function createCorrection(request, response) {
  const correction = await correctionService.createCorrection(request.validated.body, request.user);
  return response.status(201).json(successResponse(correction));
}

export async function listCorrections(request, response) {
  const result = await correctionService.listCorrections(request.validated.query, request.user);
  return response.status(200).json(successResponse(result));
}

export async function approveCorrection(request, response) {
  const {id}=request.validated.params
  console.log(request.validated.params,'params')
  console.log('going.....................')
  const result = await correctionService.reviewCorrection(id, "APPROVED", request.user);
  return response.status(200).json(successResponse(result));
}

export async function rejectCorrection(request, response) {
  const result = await correctionService.reviewCorrection(request.validated.params.id, "REJECTED", request.user);
  return response.status(200).json(successResponse(result));
}
