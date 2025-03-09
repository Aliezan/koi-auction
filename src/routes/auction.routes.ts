import { Router } from "express";
import {
  createAuction,
  deleteAuction,
  getAuctionDetails,
  getAuctions,
  joinAuction,
  leaveAuction,
  updateAuction,
} from "../controllers/auction.controllers";
import { getAuctionJoinedByUserId } from "../controllers/auctionparticipant.controllers";
import { parsePaginationAndFilters } from "../middlewares/parsePaginationFilter.middleware";
import { authorize, protect } from "../middlewares/auth.middleware";
import createAuctionValidator from "../middlewares/auctionValidator/createAuctionValidator";
import updateAuctionValidator from "../middlewares/auctionValidator/updateAuctionValidator";
import joinAuctionValidator from "../middlewares/auctionValidator/joinAuctionValidator";
import { deleteAuctionValidator } from "../middlewares/auctionValidator/deleteAuctionValidator";

const auctionRouter = Router();

auctionRouter.get("/", parsePaginationAndFilters, getAuctions);
auctionRouter.post(
  "/",
  protect,
  authorize(["admin"]),
  createAuctionValidator,
  createAuction,
);

auctionRouter.get(
  "/participated",
  protect,
  parsePaginationAndFilters,
  getAuctionJoinedByUserId,
);

auctionRouter.get("/:auction_id", getAuctionDetails);
auctionRouter.put(
  "/:auction_id",
  protect,
  authorize(["admin"]),
  updateAuctionValidator,
  updateAuction,
);
auctionRouter.post(
  "/:auction_id/join",
  protect,
  joinAuctionValidator,
  joinAuction,
);

auctionRouter.post("/:auction_id/leave", protect, leaveAuction);

auctionRouter.delete(
  "/:auction_id",
  protect,
  authorize(["admin"]),
  deleteAuctionValidator,
  deleteAuction,
);

export default auctionRouter;
