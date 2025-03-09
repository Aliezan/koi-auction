import AuctionParticipant from "../entities/AuctionParticipant";
import auctionParticipantRepository from "../repositories/auctionparticipant.repository";
import { IAuctionParticipantFilter } from "../types/entityfilter";
import { PaginationOptions } from "../utils/pagination";
import { ErrorHandler } from "../utils/response/handleError";

const getAllAuctionParticipants = async (
  filters?: IAuctionParticipantFilter,
  pagination?: PaginationOptions,
) => {
  const { auctionParticipants, count } =
    await auctionParticipantRepository.getAllAuctionParticipants(
      filters,
      pagination,
    );
  return { auctionParticipants, count };
};

const getAuctionParticipantById = async (auctionParticipantId: string) => {
  const auctionParticipant =
    await auctionParticipantRepository.getAllAuctionParticipants({
      auctionParticipantId,
    });
  if (!auctionParticipant) {
    throw ErrorHandler.notFound(
      `Auction participant with ID ${auctionParticipantId} not found`,
    );
  }
  return auctionParticipant;
};

const getAuctionParticipantByAuctionId = async (auctionId: string) => {
  const auctionParticipant =
    await auctionParticipantRepository.getAllAuctionParticipants({ auctionId });
  if (!auctionParticipant) {
    throw ErrorHandler.notFound(
      `Auction participant with auction ID ${auctionId} not found`,
    );
  }
  return auctionParticipant;
};

const getAuctionParticipantByUserId = async (userId: string) => {
  const auctionParticipant =
    await auctionParticipantRepository.getAllAuctionParticipants({ userId });
  if (!auctionParticipant) {
    throw ErrorHandler.notFound(
      `Auction participant with user ID ${userId} not found`,
    );
  }
  return auctionParticipant;
};

const createAuctionParticipant = async (
  auctionParticipantData: Partial<AuctionParticipant>,
) => {
  const auctionParticipant = auctionParticipantRepository.create(
    auctionParticipantData,
  );
  await auctionParticipantRepository.save(auctionParticipant);
  return auctionParticipant;
};

const getAuctionsByParticipant = async (
  userId: string,
  pagination: PaginationOptions,
) => {
  const { auctions, count } =
    await auctionParticipantRepository.getAuctionsByParticipant(
      userId,
      pagination,
    );
  return { auctions, count };
};

export const auctionParticipantService = {
  getAllAuctionParticipants,
  getAuctionParticipantById,
  getAuctionParticipantByAuctionId,
  getAuctionParticipantByUserId,
  createAuctionParticipant,
  getAuctionsByParticipant,
};
