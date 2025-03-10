import Auction from "../entities/Auction";
import Bid from "../entities/Bid";
import { NotificationType } from "../entities/Notification";
import { auctionJobs } from "../jobs/auction.jobs";
import auctionRepository from "../repositories/auction.repository";
import bidRepository from "../repositories/bid.repository";
import { auctionEmitter } from "../sockets/auction.socket";
import { IBidFilter } from "../types/entityfilter";
import { IBidOrder } from "../types/entityorder.types";
import { PaginationOptions } from "../utils/pagination";
import { ErrorHandler } from "../utils/response/handleError";
import { notificationService } from "./notification.service";

const getAllBids = async (
  filters?: IBidFilter,
  pagination?: PaginationOptions,
  order?: IBidOrder,
) => {
  const { bids, count } = await bidRepository.findAllAndCount(
    filters,
    pagination,
    order,
  );
  return { bids, count };
};

const getBidsByAuctionId = async (
  auction_id: string,
  filters?: IBidFilter,
  pagination?: PaginationOptions,
  order?: IBidOrder,
) => {
  const { bids, count } = await bidRepository.findBidByAuctionId(
    auction_id,
    filters,
    pagination,
    order,
  );
  if (!bids) {
    throw ErrorHandler.notFound(
      `Bids not found for auction with ID ${auction_id}`,
    );
  }

  return { bids, count };
};

const getBidByUserId = async (
  user_id: string,
  filters?: IBidFilter,
  pagination?: PaginationOptions,
) => {
  const { bids, count } = await bidRepository.findBidByUserId(
    user_id,
    filters,
    pagination,
  );
  if (!bids) {
    throw ErrorHandler.notFound(`Bids not found for user with ID ${user_id}`);
  }
  return { bids, count };
};

const getBidById = async (bid_id: string) => {
  const bid = await bidRepository.findBidById(bid_id);
  if (!bid) {
    throw ErrorHandler.notFound(`Bid with ID ${bid_id} not found`);
  }
  return bid;
};

const placeBid = async (
  user_id: string,
  auction_id: string,
  bid_amount: number,
): Promise<Bid> =>
  auctionRepository.manager.transaction(async (transactionalEntityManager) => {
    const auction = await transactionalEntityManager.findOne(Auction, {
      where: { auction_id },
      lock: { mode: "pessimistic_write" },
    });

    if (!auction) {
      throw ErrorHandler.notFound(`Auction with ID ${auction_id} not found`);
    }

    // Create and save the bid entity
    const bid = bidRepository.create({
      user: { user_id },
      auction: { auction_id },
      bid_amount,
      bid_time: new Date(),
    });
    const savedBid = await transactionalEntityManager.save(bid);

    // Make all auction updates at once
    const INJURY_TIME = 1000 * 60 * 5; // 5 minutes
    const timeRemaining = auction.end_datetime.getTime() - Date.now();

    // Start collecting all auction changes
    let auctionChanged = false;

    if (timeRemaining < INJURY_TIME) {
      auction.end_datetime = new Date(
        auction.end_datetime.getTime() + INJURY_TIME,
      );
      auctionChanged = true;
      // Reschedule end job
      await auctionJobs.scheduleEndJob(auction);
    }

    // Update auction's highest bid if this is the highest
    if (
      !auction.highest_bid_id ||
      bid_amount > (auction.current_highest_bid ?? 0)
    ) {
      auction.highest_bid_id = bid.bid_id;
      auctionChanged = true;
    }

    // Update auction's highest bid amount
    auction.current_highest_bid = bid_amount;
    auctionChanged = true;

    // Save all auction changes at once if any changes were made
    if (auctionChanged) {
      await transactionalEntityManager.save(auction);
    }

    // Fetch the complete bid data within the same transaction
    const completeBid = await transactionalEntityManager
      .createQueryBuilder(Bid, "bid")
      .leftJoinAndSelect("bid.user", "user")
      .leftJoinAndSelect("bid.auction", "auction")
      .select([
        "bid",
        "user.user_id",
        "user.email",
        "user.username",
        "auction.auction_id",
        "auction.current_highest_bid",
        "auction.end_datetime",
      ])
      .where("bid.bid_id = :bidId", { bidId: savedBid.bid_id })
      .getOne();

    if (!completeBid) {
      throw ErrorHandler.internalServerError(
        `Failed to fetch saved bid ${savedBid.bid_id}`,
      );
    }

    // Get previous highest bidder for notification
    const previousHighestBid = await transactionalEntityManager
      .createQueryBuilder(Bid, "bid")
      .leftJoinAndSelect("bid.user", "user")
      .where("bid.auction = :auctionId", { auctionId: auction_id })
      .orderBy("bid.bid_amount", "DESC")
      .skip(1)
      .take(1)
      .getOne();

    // Notify previous highest bidder if exists
    if (previousHighestBid && previousHighestBid.user.user_id !== user_id) {
      await notificationService.createNotification(
        previousHighestBid.user.user_id,
        NotificationType.AUCTION,
        `You have been outbid on auction ${auction_id}`,
        auction_id,
      );
    }

    auctionEmitter.bidUpdate(auction_id, completeBid);

    return completeBid;
  });

export const bidService = {
  getAllBids,
  getBidsByAuctionId,
  getBidByUserId,
  getBidById,
  placeBid,
};
