import { Router } from "express";
import { authorize, protect } from "../middlewares/auth.middleware";
import {
  createDeposit,
  getAllWallets,
  getWalletById,
  getWalletByUserId,
  updateWallet,
} from "../controllers/wallet.controllers";
import { uploadProofOfPayment } from "../middlewares/upload.middleware"; // Import the multer middleware
import createDepositValidator from "../middlewares/walletValidator/createDepositValidator";
import { parsePaginationAndFilters } from "../middlewares/parsePaginationFilter.middleware";

const walletRouter = Router();

walletRouter.get(
  "/",
  protect(),
  authorize(["admin"]),
  parsePaginationAndFilters,
  getAllWallets,
);
walletRouter.get("/me", protect(), authorize(["user"]), getWalletByUserId);
walletRouter.get("/:id", protect(), authorize(["admin"]), getWalletById);
walletRouter.put("/:id", protect(), authorize(["admin"]), updateWallet);
walletRouter.post(
  "/deposit",
  protect(),
  authorize(["user", "admin"]),
  uploadProofOfPayment,
  createDepositValidator,
  createDeposit,
);

export default walletRouter;
