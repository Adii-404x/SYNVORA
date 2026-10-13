export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
    cause?: unknown,
  ) {
    super(message, cause === undefined ? undefined : { cause });
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

