import { Router } from "express";
import { authorize, protect } from "../middlewares/auth.middleware";
import {
  warnUser,
  deleteWarning,
  getAllWarnings,
  updateWarning,
  getUserWarnings,
  getWarningByUserId,
  getWarningById,
  banUser,
  liftBanUser,
} from "../controllers/warning.controllers";
import { parsePaginationAndFilters } from "../middlewares/parsePaginationFilter.middleware";
import warnUserValidator from "../middlewares/warningValidator/warnUser.validator";

const warningRouter = Router();

warningRouter.get(
  "/",
  protect(),
  authorize(["admin"]),
  parsePaginationAndFilters,
  getAllWarnings,
);

warningRouter.get("/:id", protect(), authorize(["admin"]), getWarningById);

warningRouter.get(
  "/user/:user_id",
  protect(),
  authorize(["admin"]),
  getWarningByUserId,
);

warningRouter.post(
  "/user/ban/:user_id",
  protect(),
  authorize(["admin"]),
  banUser,
);
warningRouter.post(
  "/user/unban/:user_id",
  protect(),
  authorize(["admin"]),
  liftBanUser,
);

warningRouter.get("/me", protect(), authorize(["user"]), getUserWarnings);
warningRouter.post(
  "/warn",
  protect(),
  authorize(["admin"]),
  warnUserValidator,
  warnUser,
);

warningRouter.put("/:id", protect(), authorize(["admin"]), updateWarning);
warningRouter.delete("/:id", protect(), authorize(["admin"]), deleteWarning);

export default warningRouter;
