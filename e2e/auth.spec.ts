import request from "supertest";
import { Express } from "express";
import { AppDataSource } from "../src/config/data-source";
import createApp from "../src/app";
import User from "../src/entities/User";

describe("Authentication routes", () => {
  let app: Express;

  beforeAll(async () => {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      app = createApp();
    } catch (error) {
      console.error("Test setup failed:", error);
      throw error;
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.delete({ email: "e2e@mail.com" }); // Clean up test user
  });

  describe("/api/login", () => {
    it("should return 400 and error message for missing required fields", async () => {
      const res = await request(app).post("/api/auth/login").send();
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Missing required fields");
    });

    it("should return 400 and error message if one of the field is missing", async () => {
      const res = await request(app).post("/api/login").send({
        password: "password",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return 200 and user data with token", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "admin-0@mail.com",
        password: "admin-0",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toEqual({
        user_id: expect.any(String),
        name: "admin-0",
        email: "admin-0@mail.com",
        role: "admin",
      });
    });

    it("should return 401 for invalid credentials with an error message", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "invalid@mail.com",
        password: "invalid",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Invalid email or password");
    });
  });

  describe("/api/register", () => {
    it("should return 200 and message for successful registration", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "E2E User",
        email: "e2e@mail.com",
        password: "e2e-password",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("User registered successfully");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await request(app).post("/api/auth/register").send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Missing required fields");
    });

    it("should return 400 for invalid role", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "E2E User",
        email: "e2e@mail.com",
        role: "invalid-role",
        password: "e2e-password",
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Invalid role");
    });
  });
});
