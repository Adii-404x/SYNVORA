import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { ApiError } from "../utils/api-error";

export const validate = (schema: ZodType) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(400, "Validation failed", true));
    }
    next(error);
  }
};

