/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import User, { UserRole } from "../../entities/User";

const createAdminUserValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Missing request body!" });
      return;
    }

    const requiredFields = ["username", "email", "password"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      res.status(400).json({
        message: "Missing required fields",
      });
      return;
    }

    const user = new User();
    user.username = req.body.username;
    user.email = req.body.email;
    user.password = req.body.password;

    if (req.body.role !== undefined) {
      if (!Object.values(UserRole).includes(req.body.role)) {
        res.status(400).json({
          message: "Invalid role",
        });
        return;
      }
      user.role = req.body.role;
    }

    const errors = await validate(user, { skipMissingProperties: true });
    if (errors.length > 0) {
      res.status(400).json({
        message: "Validation failed",
        errors: errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        })),
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export default createAdminUserValidator;
