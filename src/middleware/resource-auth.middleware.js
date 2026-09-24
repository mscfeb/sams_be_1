import * as authorization from "../utils/authorization.js";

function authorize(check) {
  return async (request, _response, next) => {
    try {
      request.authorizedResource = await check(request.user, request.params.id);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export const authorizeSubjectOffering = authorize(authorization.assertSubjectOfferingAccess);
export const authorizeAttendanceSession = authorize(authorization.assertFacultyOwnsAttendanceSession);
export const authorizeStudent = authorize(authorization.assertStudentOwnsStudent);
export const authorizeAttendanceRecord = authorize(authorization.assertStudentOwnsAttendanceRecord);
