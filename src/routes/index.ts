import { Router, Request, Response, NextFunction } from "express";
import userRouter from "./user.routes";
import auctionRouter from "./auction.routes";
import walletRouter from "./wallet.routes";
import transactionRouter from "./transaction.routes";
import bidRouter from "./bid.routes";
import authRouter from "./auth.routes";
import notificationRouter from "./notification.routes";
import warningRouter from "./warning.routes";
import statsRouter from "./stats.routes";
import jobRouter from "./job.routes";
import socketRouter from "./socket.routes";
import wishlistRouter from "./wishlist.routes";
import { errorHandler } from "../utils/response/handleError";

const router = Router();

router.get("/", (_, res) => {
  res.json({ message: "Welcome to the API", last_updated: "2025-13-03 05:22" });
});

// Health check or welcome message route
router.get("/health", (_, res) => {
  res.json({ message: "Ok" });
});

// Mounting the other routers
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/auctions", auctionRouter);
router.use("/wallets", walletRouter);
router.use("/transactions", transactionRouter);
router.use("/bids", bidRouter);
router.use("/notifications", notificationRouter);
router.use("/warnings", warningRouter);
router.use("/stats", statsRouter);
router.use("/jobs", jobRouter);
router.use("/socket", socketRouter);
router.use("/wishlists", wishlistRouter);

// Catch-all route for undefined paths
router.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next); // Pass the error to the handler
});

export default router;
