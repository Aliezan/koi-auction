import { RequestHandler, Router } from "express";
import {} from "../controllers/bid.controllers";
import { authorize, protect } from "../middlewares/auth.middleware";
import { parsePaginationAndFilters } from "../middlewares/parsePaginationFilter.middleware";
import { userService } from "../services/user.service";
import { auctionService } from "../services/auction.service";
import { transactionService } from "../services/transaction.service";
import { TransactionStatus, TransactionType } from "../entities/Transaction";
import { sendSuccessResponse } from "../utils/response/handleResponse";

const statsRouter = Router();

const getStatus: RequestHandler = async (req, res, next) => {
  try {
    const [users, newUsersThisWeek, auctions, deposits, pendingDeposits] =
      await Promise.all([
        userService.getAllUsers(),
        userService.getNewUserThisWeek(),
        auctionService.getAllAuctions(),
        auctionService.getAuctionEndingSoon(),
        transactionService.getAllTransactions({
          type: TransactionType.DEPOSIT,
        }),
        transactionService.getAllTransactions({
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
        }),
      ]);

    const stats = {
      userTotal: users.count,
      userTotalThisWeek: newUsersThisWeek.count,
      auctionsActive: auctions.count,
      auctionsEndingSoon: auctions.count,
      depositsTotal: deposits.count,
      depositsPendingTotal: pendingDeposits.count,
    };
    sendSuccessResponse(res, { data: stats });
  } catch (error) {
    next(error);
  }
};

statsRouter.get(
  "/",
  protect(),
  authorize(["admin"]),
  parsePaginationAndFilters,
  getStatus,
);

export default statsRouter;
