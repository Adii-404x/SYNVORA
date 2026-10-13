import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  const bearerMatch = authHeader?.match(/^Bearer\s+(\S+)$/i);
  if (!bearerMatch) {
    return next(new ApiError(401, "Authentication token required"));
  }

  const token = bearerMatch[1];

  try {
    // Create a client using the provided token to verify the user
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new ApiError(401, "Invalid or expired token"));
    }

    // Attach user ID and the scoped client to the request
    req.userId = user.id;
    req.supabase = supabase;

    next();
  } catch (err) {
    next(new ApiError(401, "Authentication failed"));
  }
};

