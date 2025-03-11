import express from "express";
import { config } from "dotenv";
import "reflect-metadata";
import morgan from "morgan";
import cors from "cors";
import router from "./routes";

export default function createApp() {
  config();

  const app = express();
  app.use(express.json()); // Ensure JSON parsing before morgan
  app.use(express.urlencoded({ extended: true }));

  // Morgan custom tokens
  morgan.token("reqBody", (req: any) =>
    ["POST", "PUT", "PATCH"].includes(req.method)
      ? JSON.stringify(req.body)
      : "",
  );

  morgan.token("auth", (req: any) => req.headers.authorization || "");

  // // Move Morgan middleware before routes
  app.use(
    morgan(":method :url :status :response-time ms Auth::auth Body::reqBody"),
  );

  app.use(
    cors({
      credentials: true,
      preflightContinue: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      origin: true,
    }),
  );
  app.options("*", cors());

  app.use("/api", router); // Define routes after middleware

  return app;
}
