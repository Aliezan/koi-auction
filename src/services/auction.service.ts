/* eslint-disable @typescript-eslint/no-use-before-define */
import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { ErrorHandler } from "../utils/response/handleError";
import { PaginationOptions } from "../utils/pagination";
import { IAuctionFilter } from "../types/entityfilter";
import { IAuctionOrder } from "../types/entityorder.types";
import { TransactionType, TransactionStatus } from "../entities/Transaction";
import Auction, { AuctionStatus } from "../entities/Auction";
import auctionRepository from "../repositories/auction.repository";
import walletRepository from "../repositories/wallet.repository";
import auctionParticipantRepository from "../repositories/auctionparticipant.repository";
import transactionRepository from "../repositories/transaction.repository";
import userRepository from "../repositories/user.repository";
import { auctionEmitter } from "../sockets/auction.socket";
import { auctionJobs } from "../jobs/auction.jobs";
import { notificationService } from "./notification.service";
import { NotificationType } from "../entities/Notification";

export const getAllAuctions = async (
  filters?: IAuctionFilter,
  pagination?: PaginationOptions,
  order?: IAuctionOrder,
) => {
  const { auctions, count } = await auctionRepository.getAllAuctions(
    filters,
    pagination,
    order,
  );
  return { auctions, count };
};

const getAuctionById = async (auction_id: string) => {
  const auction = await auctionRepository.findAuctionById(auction_id);
  if (!auction) {
    throw ErrorHandler.notFound(`Auction with ID ${auction_id} not found`);
  }
  return auction;
};

const createAuction = async (
  data: Partial<Auction & { item_id: string }>,
  user_id: string,
) => {
  try {
    const user = await userRepository.findUserById(user_id);
    if (!user) {
      throw ErrorHandler.notFound(`User with ID ${user_id} not found`);
    }

    const auction = await auctionRepository.create({
      ...data,
      user: {
        user_id: user.user_id,
        username: user.username,
      },
    });

    await auctionRepository.save(auction);

    return auction;
  } catch (error) {
    throw ErrorHandler.internalServerError("Error creating auction", error);
  }
};

const updateAuction = async (
  auction_id: string,
  user_id: string,
  data: Partial<Auction>,
) => {
  try {
    const {
      title,
      description,
      start_datetime,
      end_datetime,
      item,
      reserve_price,
      participation_fee,
      bid_increment,
      status,
      winner_id,
      final_price,
      rich_description,
    } = data;

    // Fetch the auction by ID to ensure it exists and get the full entity
    const auction = await auctionRepository.findAuctionById(auction_id);

    if (!auction) {
      throw ErrorHandler.notFound("Auction not found");
    }

    // Update the auction entity with new data
    auction.title = title ?? auction.title;
    auction.description = description ?? auction.description;
    auction.rich_description = rich_description ?? auction.rich_description;
    auction.participation_fee = participation_fee ?? auction.participation_fee;
    auction.item = item ?? auction.item;
    auction.start_datetime = start_datetime ?? auction.start_datetime;
    auction.end_datetime = end_datetime ?? auction.end_datetime;
    auction.reserve_price = reserve_price ?? auction.reserve_price;
    auction.bid_increment = bid_increment ?? auction.bid_increment;
    auction.status = (status?.toUpperCase() as AuctionStatus) ?? auction.status;

    // Fetch only necessary user information, e.g., user_id
    const user = await userRepository.findUserById(user_id);
    if (!user) {
      throw ErrorHandler.notFound(`User with ID ${user_id} not found`);
    }

    auction.user = user; // Assign the user entity with only necessary fields

    if (auction.status === AuctionStatus.PENDING && winner_id) {
      auction.winner_id = winner_id;
      auction.final_price = final_price ?? null;
      await notificationService.createNotification(
        auction.winner_id,
        NotificationType.AUCTION,
        `You won the auction ${auction.title}. Our admin will contact you in person to complete payment.`,
        auction.auction_id,
      );
      // Refund and notify other participants
      await refundParticipationFee(auction.auction_id);
      const nonWinnerParticipants = auction.participants.filter(
        (p) => p.user.user_id !== auction.winner_id,
      );
      await Promise.all(
        nonWinnerParticipants.map((participant) =>
          notificationService.createNotification(
            participant.user.user_id,
            NotificationType.AUCTION,
            `The auction ${auction.title} has ended. You didn't win this time. We have refunded your participation fee!`,
            auction.auction_id,
          ),
        ),
      );
    }

    // Save the updated auction entity
    const updatedAuction = await auctionRepository.save(auction);

    // If the auction is published, schedule its start
    if (updatedAuction.status === AuctionStatus.PUBLISHED) {
      auctionJobs.schedule(updatedAuction);
      auctionJobs.scheduleEndJob(updatedAuction);
    }

    // Cancel job if auction changed from published to draft or else
    if (updatedAuction.status !== AuctionStatus.PUBLISHED) {
      auctionJobs.cancel(updatedAuction.auction_id);
    }

    // Return auction without full user details
    return {
      ...updatedAuction,
      user: {
        user_id: auction.user.user_id, // Only return the user_id
      },
    };
  } catch (error) {
    throw ErrorHandler.internalServerError("Error updating auction", error);
  }
};

const joinAuction = async (auction_id: string, user_id: string) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const auction = await auctionRepository.findAuctionById(auction_id);
    if (!auction) {
      throw ErrorHandler.notFound(`Auction with ID ${auction_id} not found`);
    }

    const wallet = await walletRepository.findWalletByUserId(user_id);
    if (wallet.balance < auction.participation_fee) {
      throw ErrorHandler.badRequest("Insufficient balance");
    }

    wallet.balance -= auction.participation_fee;
    await queryRunner.manager.save(wallet);

    const transaction = transactionRepository.create({
      wallet,
      amount: auction.participation_fee,
      type: TransactionType.PARTICIPATE,
      status: TransactionStatus.COMPLETED,
      proof_of_payment: null,
    });
    await queryRunner.manager.save(transaction);

    const auctionParticipant = auctionParticipantRepository.create({
      auction,
      user: { user_id },
    });
    await queryRunner.manager.save(auctionParticipant);

    await queryRunner.commitTransaction();

    try {
      const participant = await auctionParticipantRepository.getOne({
        userId: user_id,
        auctionId: auction_id,
      });
      if (participant) {
        await auctionEmitter.participantUpdate(auction_id, participant);
      }
    } catch (socketError) {
      console.error("Socket emission failed:", socketError);
    }

    return {
      message: "User successfully joined the auction",
      auctionParticipant,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw ErrorHandler.internalServerError("Error joining auction", error);
  } finally {
    await queryRunner.release();
  }
};

export const getAuctionEndingSoon = async (
  startDateFrom: Date = new Date(), // Default to the start of today
  startDateTo: Date = new Date(new Date().setHours(23, 59, 59, 999)), // Default to the end of today
) => {
  const filters: IAuctionFilter = {
    startDateFrom, // Pass Date object directly
    startDateTo, // Pass Date object directly
    status: AuctionStatus.STARTED,
  };

  const { auctions, count } = await auctionRepository.getAllAuctions(filters);
  return { auctions, count };
};

const refundParticipationFee = async (auction_id: string) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const auction = await auctionRepository.findAuctionById(auction_id);
    if (!auction) {
      throw ErrorHandler.notFound(`Auction with ID ${auction_id} not found`);
    }

    const winnerId = auction.winner_id || null;
    const participants = await auctionParticipantRepository.find({
      where: { auction: { auction_id } },
      relations: ["user"],
    });

    const participantIds = participants
      .filter((p) => p.user.user_id !== winnerId)
      .map((p) => p.user.user_id);

    if (participantIds.length === 0) {
      return {
        refundedAmount: 0,
        participantsRefunded: 0,
        totalParticipants: participants.length,
      };
    }

    // Batch update wallets
    await queryRunner.manager
      .createQueryBuilder()
      .update("wallet")
      .set({
        balance: () => `balance + ${auction.participation_fee}`,
      })
      .where({ user_id: In(participantIds) })
      .execute();

    // Batch create refund transactions
    const refundTransactions = participantIds.map((userId) => ({
      wallet_id: userId,
      amount: auction.participation_fee,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      proof_of_payment: null,
    }));

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into("transaction")
      .values(refundTransactions)
      .execute();

    await queryRunner.commitTransaction();

    return {
      refundedAmount: auction.participation_fee * participantIds.length,
      participantsRefunded: participantIds.length,
      totalParticipants: participants.length,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw ErrorHandler.internalServerError("Error processing refund", error);
  } finally {
    await queryRunner.release();
  }
};

const leaveAuction = async (auction_id: string, user_id: string) => {
  try {
    const auction = await auctionRepository.findAuctionById(auction_id);
    if (!auction) {
      throw ErrorHandler.notFound(`Auction with ID ${auction_id} not found`);
    }

    const participant = await auctionParticipantRepository.findOne({
      where: { auction: { auction_id }, user: { user_id } },
      relations: ["user", "auction"],
    });

    if (!participant) {
      throw ErrorHandler.notFound("User not found in auction");
    }

    // Only refund if auction hasn't started yet
    if (auction.status === AuctionStatus.PUBLISHED) {
      await refundParticipationFee(auction_id);
    }

    await auctionParticipantRepository.delete(
      participant.auction_participant_id,
    );
    return { message: "User successfully left the auction" };
  } catch (error) {
    throw ErrorHandler.internalServerError("Error leaving auction", error);
  }
};

const deleteAuction = async (auction_id: string, user_id: string) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const auction = await auctionRepository.findAuctionById(auction_id);
    if (!auction) {
      throw ErrorHandler.notFound(`Auction with ID ${auction_id} not found`);
    }

    await refundParticipationFee(auction_id);

    await queryRunner.manager.update(Auction, auction_id, {
      status: AuctionStatus.DELETED,
      user: { user_id },
    });
    await queryRunner.manager.softDelete(Auction, auction_id);

    await queryRunner.commitTransaction();

    auctionJobs.cancel(auction_id);
    return auction;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw ErrorHandler.internalServerError("Error deleting auction", error);
  } finally {
    await queryRunner.release();
  }
};

export const auctionService = {
  getAllAuctions,
  getAuctionById,
  joinAuction,
  createAuction,
  updateAuction,
  getAuctionEndingSoon,
  deleteAuction,
  leaveAuction,
  refundParticipationFee,
};
