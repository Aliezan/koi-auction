import { Router } from "express";
import {
  loginController,
  registerAdmin,
  registerController,
} from "../controllers/auth.controllers";
import createUserValidator from "../middlewares/userValidator/createUserValidator";
import createAdminUserValidator from "../middlewares/userValidator/createAdminUserValidator";
import loginUserValidator from "../middlewares/userValidator/loginUserValidator";
import { protect, authorize } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/login", loginUserValidator, loginController);
authRouter.post("/register", createUserValidator, registerController);
authRouter.post(
  "/register-admin",
  protect,
  authorize(["admin"]),
  createAdminUserValidator,
  registerAdmin,
);
export default authRouter;
