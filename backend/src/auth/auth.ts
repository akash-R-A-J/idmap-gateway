// src/middleware/auth.ts
import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import logger from "../config/logger.js";

/**
 * --------------------------------------------------------------------
 * userAuth Middleware
 * --------------------------------------------------------------------
 * Verifies JWT tokens provided in request headers.
 * Attaches the decoded `userId` to the request object if valid.
 * --------------------------------------------------------------------
 *
 * Expected Header:
 *    token: <JWT_TOKEN>
 *
 * Environment Variables:
 *    JWT_SECRET: Secret key used to sign/verify JWTs
 * --------------------------------------------------------------------
 */
export const userAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.token as string;

  if (!token) {
    logger.warn("Missing authentication token in request headers");
    return res.status(400).json({ message: "invalid request" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decoded) {
      logger.warn("JWT verification failed: invalid token");
      return res.status(400).json({ message: "invalid token" });
    }

    req.userId = decoded.userId;
    logger.debug(`User authenticated successfully: ${req.userId}`);
    next();
  } catch (err) {
    logger.error({ err }, "Authentication error");
    return res.status(401).json({ message: "unauthorized" });
  }
};
