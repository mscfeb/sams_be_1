import { successResponse } from "../../utils/response.js";

export function returnAuthorizedResource(request, response) {
  return response.status(200).json(successResponse({ resource: request.authorizedResource }));
}
