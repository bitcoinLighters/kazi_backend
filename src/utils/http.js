export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export const required = (body, fields) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
  if (missing.length) throw new HttpError(400, `Missing required fields: ${missing.join(', ')}`);
};

export const idParam = (req) => String(req.params.id || '').trim();

