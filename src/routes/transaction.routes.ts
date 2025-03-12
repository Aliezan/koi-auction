import { Router } from "express";
import {
  getTransactionById,
  getTransactions,
  getUserTransactions,
  updateDepositTransaction,
} from "../controllers/transaction.controllers";
import { authorize, protect } from "../middlewares/auth.middleware";
import { parsePaginationAndFilters } from "../middlewares/parsePaginationFilter.middleware";
import updateDepositValidator from "../middlewares/transactionValidator/updateDepositValidator";

const transactionRouter = Router();

transactionRouter.get(
  "/",
  protect(),
  authorize(["admin"]),
  parsePaginationAndFilters,
  getTransactions,
);

transactionRouter.get(
  "/me",
  protect(),
  authorize(["user", "admin"]),
  parsePaginationAndFilters,
  getUserTransactions,
);

transactionRouter.get(
  "/:id",
  protect(),
  authorize(["user", "admin"]),
  getTransactionById,
);

transactionRouter.put(
  "/:id",
  protect(),
  authorize(["admin"]),
  updateDepositValidator,
  updateDepositTransaction,
);

export default transactionRouter;
