import { Request, Response, NextFunction } from "express";

// Handles missing fields by checking for null, undefined, or empty values
export const handleMissingFields = (
  res: Response,
  fields: { [key: string]: any }, // Expecting an object with key-value pairs
): boolean => {
  // Find keys with null, undefined, or empty values
  const missingFields = Object.keys(fields).filter(
    (key) => fields[key] == null || fields[key] === "",
  );

  // If there are missing fields, return true and respond with the names of the missing fields
  if (missingFields.length > 0) {
    res.status(400).json({
      message: "Missing required fields",
      missingFields,
    });
    return true;
  }

  return false;
};

// Generalized handleNotFound for any entity
export const handleNotFound = (
  entity: string, // Name of the entity (e.g., User, Auction)
  res: Response,
): boolean => {
  res.status(404).json({ message: `${entity} not found` });
  return true;
};

// Custom ErrorHandler class to handle different HTTP errors
export class ErrorHandler extends Error {
  public statusCode: number;

  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = "ErrorHandler";
    this.statusCode = statusCode;
    this.details = details;

    // Ensure the prototype chain is correctly set
    Object.setPrototypeOf(this, ErrorHandler.prototype);
  }

  // Static methods to create errors with specific HTTP status codes
  static badRequest(message: string, details?: any) {
    return new ErrorHandler(message, 400, details);
  }

  static notFound(message: string, details?: any) {
    return new ErrorHandler(message, 404, details);
  }

  static internalServerError(message: string, details?: any) {
    return new ErrorHandler(message, 500, details);
  }

  static forbidden(message: string, details?: any) {
    return new ErrorHandler(message, 403, details);
  }
}

// Global error handling middleware
export const errorHandler = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  console.error(err);
  // Check if the error is an instance of ErrorHandler
  if (err instanceof ErrorHandler) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details || null,
      stack: process.env.APP_ENV === "local" ? err.stack : {},
    });
  }

  // For other types of errors, return a 500 server error
  return res.status(500).json({
    message: "Internal server error",
  });
};
