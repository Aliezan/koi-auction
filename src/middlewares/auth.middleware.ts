import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, AuthUser, AuthMiddleware } from "../types/auth";

export const protect =
  (requireAuth: boolean = true): AuthMiddleware =>
  (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      if (requireAuth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      next(); // Allow access without authentication
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "",
      ) as AuthUser;

      Object.defineProperty(req, "user", {
        value: decoded,
        enumerable: true,
        writable: false,
      });
      next();
    } catch (error) {
      if (requireAuth) {
        if (error instanceof jwt.TokenExpiredError) {
          res.status(401).json({ message: "Token expired" });
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      } else {
        next(); // If auth is optional, proceed even if the token is invalid
      }
    }
  };

export const authorize =
  (roles: string[]): AuthMiddleware =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { user } = req as AuthenticatedRequest;

    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
