import jwt, { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";

export const Roles = ["USER", "ADMIN"] as const;
export type Role = (typeof Roles)[number];

export interface AuthUser {
  id: string;
  role: Role;
}

const tokenPayloadSchema = z.object({
  id: z.string(),
  role: z.enum(Roles),
});

const ALGORITHM = "HS256";

export const generateAccessToken = (user: AuthUser): string =>
  jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

/** Throws if the token is invalid, expired, or carries an unexpected payload. */
export const verifyAccessToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  return tokenPayloadSchema.parse(decoded);
};
