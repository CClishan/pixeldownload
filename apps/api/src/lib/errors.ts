export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: string;

  constructor(code: string, message: string, statusCode = 400, details?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asAppError = (error: unknown, fallbackCode = 'internal_error') => {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  return new AppError(fallbackCode, message, 500);
};
