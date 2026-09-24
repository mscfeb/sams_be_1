export function validate(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query
    });

    if (!result.success) {
      return next(result.error);
    }

    request.validated = result.data;
    request.body = result.data.body;
    return next();
  };
}
