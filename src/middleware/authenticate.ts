import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import { Role, verifyAccessToken } from "../utils/jwt";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw HttpError.unauthorized("Access token missing");
  }

  try {
    req.user = verifyAccessToken(token);
  } catch {
    throw HttpError.unauthorized("Token expired or invalid");
  }

  next();
};

/** Must run after `authenticate`. */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw HttpError.forbidden("You do not have permission to access this resource");
    }
    next();
  };
