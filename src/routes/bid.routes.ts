import { Router } from "express";
import {
  getBids,
  getBidsByAuctionId,
  getBidByUserId,
  placeBid,
} from "../controllers/bid.controllers";
import { authorize, protect } from "../middlewares/auth.middleware";
import { parsePaginationAndFilters } from "../middlewares/parsePaginationFilter.middleware";
import createBidValidator from "../middlewares/bidValidator/createBidValidator";

const bidRouter = Router();

bidRouter.get(
  "/",
  protect(),
  authorize(["admin"]),
  parsePaginationAndFilters,
  getBids,
);
bidRouter.get("/me", protect(), getBidByUserId);
bidRouter.get("/auction/:auction_id", getBidsByAuctionId);
bidRouter.post("/:auction_id", protect(), createBidValidator, placeBid);

export default bidRouter;
