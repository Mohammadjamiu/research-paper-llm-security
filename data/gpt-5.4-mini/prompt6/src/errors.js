class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function createError(statusCode, message, details) {
  return new HttpError(statusCode, message, details);
}

module.exports = {
  HttpError,
  createError,
  badRequest: (message, details) => createError(400, message, details),
  unauthorized: (message = 'Unauthorized') => createError(401, message),
  forbidden: (message = 'Forbidden') => createError(403, message),
  notFound: (message = 'Not found') => createError(404, message),
  conflict: (message, details) => createError(409, message, details),
};
