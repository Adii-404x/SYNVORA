import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error";

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  const parserError =
    typeof err === "object" && err !== null && "type" in err && typeof err.type === "string"
      ? err.type
      : undefined;
  const statusCode =
    err instanceof ApiError
      ? err.statusCode
      : parserError === "entity.parse.failed"
        ? 400
        : parserError === "entity.too.large"
          ? 413
          : 500;
  const message =
    err instanceof ApiError
      ? err.message
      : parserError === "entity.parse.failed"
        ? "Malformed JSON request body"
        : parserError === "entity.too.large"
          ? "Request body too large"
          : "Internal server error";

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
};

