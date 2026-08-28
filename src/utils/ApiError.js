export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST') {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }
}
