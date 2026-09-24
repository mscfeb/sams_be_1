import * as academicService from "./academic.service.js";
import { successResponse } from "../../utils/response.js";

export function list(resource) {
  return async (request, response) => {
    const result = await academicService.list(resource, request.validated.query);
    return response.json(successResponse(result));
  };
}

export function get(resource) {
  return async (request, response) => {
    const result = await academicService.get(resource, request.validated.params.id);
    return response.json(successResponse(result));
  };
}

export function create(resource) {
  return async (request, response) => {
    const result = await academicService.create(resource, request.validated.body, request.user.id);
    return response.status(201).json(successResponse(result));
  };
}

export function update(resource) {
  return async (request, response) => {
    const result = await academicService.update(resource, request.validated.params.id, request.validated.body, request.user.id);
    return response.json(successResponse(result));
  };
}

export function remove(resource) {
  return async (request, response) => {
    const result = await academicService.remove(resource, request.validated.params.id, request.user.id);
    return response.json(successResponse(result));
  };
}
