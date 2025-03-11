import { Request, Response, NextFunction } from "express";
import auctionRepository from "../../repositories/auction.repository";
import walletRepository from "../../repositories/wallet.repository";
import { AuthenticatedRequest } from "../../types/auth";
import { userService } from "../../services/user.service";
import { AuctionStatus } from "../../entities/Auction";
import auctionParticipantRepository from "../../repositories/auctionparticipant.repository";

const joinAuctionValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Missing request body!" });
      return;
    }

    const { auction_id } = req.params;
    const { user } = req as AuthenticatedRequest;

    // Validate auction_id
    if (!auction_id) {
      res.status(400).json({ message: "Invalid auction ID!" });
      return;
    }

    // Validate user_id
    if (!user.user_id) {
      res.status(400).json({ message: "Invalid user ID!" });
      return;
    }

    // Check if auction exists
    const auction = await auctionRepository.findAuctionById(auction_id);
    if (!auction) {
      res.status(404).json({ message: "Auction not found!" });
      return;
    }

    // Check if already joined
    const isJoined =
      await auctionParticipantRepository.isUserParticipatingInAuction(
        auction_id,
        user.user_id,
      );

    if (isJoined) {
      res
        .status(400)
        .json({ message: "User has already joined this auction!" });
      return;
    }
    console.log(auction.status);
    console.log(auction.status === AuctionStatus.STARTED);
    if (auction.status !== AuctionStatus.STARTED) {
      res.status(400).json({ message: "Cant join this auction yet!" });
      return;
    }

    // Check if user exists
    const userExist = await userService.getUserById(user.user_id);
    if (!userExist) {
      res.status(404).json({ message: "User not found!" });
      return;
    }

    // Check if the user has a wallet
    const wallet = await walletRepository.findWalletByUserId(user.user_id);
    if (!wallet) {
      res.status(404).json({ message: "Wallet not found for the user!" });
      return;
    }

    // Check if the user's wallet has enough balance
    wallet.balance = parseFloat(wallet.balance.toString());
    auction.participation_fee = parseFloat(
      auction.participation_fee.toString(),
    );

    if (wallet.balance < auction.participation_fee) {
      res
        .status(400)
        .json({ message: "Insufficient balance to join the auction!" });
      return;
    }

    // Check if the user is already a participant in the auction
    const existingParticipant = await auctionRepository
      .createQueryBuilder("auction")
      .leftJoinAndSelect("auction.participants", "participants")
      .where("auction.auction_id = :auction_id", { auction_id })
      .andWhere("participants.user_id = :user_id", { user_id: user.user_id })
      .getOne();

    if (existingParticipant) {
      res
        .status(400)
        .json({ message: "User is already a participant in the auction!" });
      return;
    }

    // Proceed to the next middleware if all validations pass
    next();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export default joinAuctionValidator;
