export class AppError extends Error {
  statusCode: number;
  code: string;
  fields?: Record<string, string[]>;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    fields?: Record<string, string[]>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function notFound(message = 'Resource not found'): AppError {
  return new AppError(message, 404, 'NOT_FOUND');
}

export function unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): AppError {
  return new AppError(message, 401, code);
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(message, 403, 'FORBIDDEN');
}

export function conflict(message: string): AppError {
  return new AppError(message, 409, 'CONFLICT');
}

export function validationError(message: string, fields?: Record<string, string[]>): AppError {
  return new AppError(message, 400, 'VALIDATION_ERROR', fields);
}

export function badRequest(message: string, code = 'INVALID_REQUEST'): AppError {
  return new AppError(message, 400, code);
}
