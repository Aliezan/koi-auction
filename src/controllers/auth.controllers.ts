import { RequestHandler } from "express";
import { authService } from "../services/auth.service";

const loginController: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({
      accessToken: result.token,
      user: {
        user_id: result.user.user_id,
        name: result.user.username,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(401).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const registerController: RequestHandler = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user_id = await authService.register(username, email, password);
    res.status(200).json({ message: "User registered successfully", user_id });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export { loginController, registerController };
