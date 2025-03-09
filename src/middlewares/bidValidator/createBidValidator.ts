import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import Bid from "../../entities/Bid";
import { auctionService } from "../../services/auction.service";
import { AuctionStatus } from "../../entities/Auction";
import { AuthenticatedRequest } from "../../types/auth";
import auctionParticipantRepository from "../../repositories/auctionparticipant.repository";

const createBidValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Missing request body!" });
      return;
    }

    const { bid_amount } = req.body;
    const { auction_id } = req.params;
    const { user } = req as AuthenticatedRequest;

    // Validate if auction_id is present
    if (!auction_id) {
      res.status(400).json({ message: "Invalid auction ID!" });
      return;
    }
    // Validate if bid_amount is present
    if (!bid_amount) {
      res.status(400).json({ message: "Bid amount is required!" });
      return;
    }

    const auction = await auctionService.getAuctionById(auction_id);

    const isJoined =
      await auctionParticipantRepository.isUserParticipatingInAuction(
        auction_id,
        user.user_id,
      );

    if (!isJoined) {
      res.status(400).json({ message: "User has not joined this auction!" });
      return;
    }

    if (auction.status !== AuctionStatus.STARTED) {
      res.status(400).json({ message: "Auction has not started yet!" });
      return;
    }

    // Parse the bid_amount to float and check for validity
    const bidAmount = parseFloat(bid_amount);
    if (Number.isNaN(bidAmount) || bidAmount <= 0) {
      res.status(400).json({
        message: "Bid amount must be a valid positive number",
      });
      return;
    }

    const currentHighestBid = Number(auction.current_highest_bid);
    const bidIncrement = Number(auction.bid_increment);
    const nextValidBid = currentHighestBid + bidIncrement;
    // Ensure bid is at least the next valid bid and follows the bid increment pattern
    if (
      bidAmount < nextValidBid ||
      (bidAmount - nextValidBid) % bidIncrement !== 0
    ) {
      res.status(400).json({
        message: `Bid amount must be at least ${nextValidBid} and follow the bid increment of ${bidIncrement}.`,
      });
      return;
    }

    // Create a Bid instance to validate against
    const bid = new Bid();
    bid.bid_amount = bidAmount;

    // Perform class-validator validation
    const errors = await validate(bid);
    if (errors.length > 0) {
      // Map the errors into a readable format
      const validationErrors = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }));

      res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
      return;
    }

    // If validation is successful, proceed to the next middleware
    next();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export default createBidValidator;
