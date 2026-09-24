export function successResponse(data) {
  return {
    success: true,
    data
  };
}

export function errorResponse(code, message, details) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };
}
