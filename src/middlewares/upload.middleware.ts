import multer, { FileFilterCallback } from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";
import { randomUUID } from "crypto";
import path from "path";
import s3 from "../config/s3";

// Define types for the file and request to ensure type safety
interface File extends Express.Multer.File {
  fieldname: "proof_of_payment"; // Adjust the fieldname according to your form field name
}

// Set up the multer storage engine to use S3
const storage = multerS3({
  s3, // The S3 instance
  bucket: process.env.AWS_S3_BUCKET_NAME || "", // Your S3 bucket name
  acl: "public-read", // Ensure the file is publicly readable
  contentDisposition: "inline", // This prevents download and tries to display the file
  contentType: multerS3.AUTO_CONTENT_TYPE, // Ensure correct MIME type
  metadata: (
    req: Request,
    file: File,
    cb: (error: Error | null, metadata: object) => void,
  ) => {
    // Set the Content-Disposition to inline to display the file in the browser
    cb(null, {
      fieldName: file.fieldname,
      "Content-Disposition": "inline", // This prevents download and tries to display the file
      "Content-Type": file.mimetype, // Ensure correct MIME type
    });
  },
  key: (
    req: Request,
    file: File,
    cb: (error: Error | null, key: string) => void,
  ) => {
    const extension = path.extname(file.originalname); // Get the file extension
    const filename = `${Date.now()}-${randomUUID()}${extension}`; // Use the extension in the filename
    cb(null, filename); // This is the filename that will be stored in S3
  },
});

// Multer setup with file filter and size limit
const fileFilter: multer.Options["fileFilter"] = (
  req: Request,
  file: File,
  cb: FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only image files are allowed!")); // Reject the file
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
});

// Export single file upload handler with type safety
export const uploadProofOfPayment = upload.single("proof_of_payment");
