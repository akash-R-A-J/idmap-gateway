import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const userAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.token as string;

  if (!token) {
    return res.status(400).json({ message: "invalid request" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    
    if (!decoded) {
      return res.status(400).json({ message: "invalid token" });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("auth error", err);
    return res.status(401).json({ message: "unauthorized" });
  }
};
