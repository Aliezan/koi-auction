import { SelectQueryBuilder } from "typeorm";
import { applyPagination } from "typeorm-extension";
import { AppDataSource as dataSource } from "../config/data-source";
import AuctionParticipant from "../entities/AuctionParticipant";
import { IAuctionParticipantFilter } from "../types/entityfilter";
import { PaginationOptions } from "../utils/pagination";

const applyAuctionParticipantFilter = (
  qb: SelectQueryBuilder<AuctionParticipant>,
  filters: IAuctionParticipantFilter = {},
) => {
  if (filters.auctionParticipantId) {
    qb.andWhere(
      "auctionParticipant.auction_participant_id = :auctionParticipantId",
      {
        auctionParticipantId: filters.auctionParticipantId,
      },
    );
  }
  if (filters.userId) {
    qb.andWhere("auctionParticipant.user.user_id = :userId", {
      userId: filters.userId,
    });
  }

  if (filters.auctionId) {
    qb.andWhere("auctionParticipant.auction.auction_id = :auctionId", {
      auctionId: filters.auctionId,
    });
  }

  if (filters.joinedAtFrom) {
    qb.andWhere("auctionParticipant.joined_at >= :joinedAtFrom", {
      joinedAtFrom: filters.joinedAtFrom,
    });
  }

  if (filters.joinedAtTo) {
    qb.andWhere("auctionParticipant.joined_at <= :joinedAtTo", {
      joinedAtTo: filters.joinedAtTo,
    });
  }

  return qb;
};

// TODO: Extend the bid repository with QueryBuilder for more complex queries
const auctionParticipantRepository = dataSource
  .getRepository(AuctionParticipant)
  .extend({
    async getAllAuctionParticipants(
      filters?: IAuctionParticipantFilter,
      pagination?: PaginationOptions,
    ) {
      const qb = this.createQueryBuilder("auctionParticipant")
        .leftJoin("auctionParticipant.user", "user")
        .leftJoin("auctionParticipant.auction", "auction")
        .select([
          "auctionParticipant",
          "user.user_id",
          "user.username",
          "auction.auction_id",
          "auction.title",
        ]);
      applyAuctionParticipantFilter(qb, filters);
      applyPagination(qb, pagination);
      const [auctionParticipants, count] = await qb.getManyAndCount();
      return { auctionParticipants, count };
    },
    // Fetch a auctionParticipant by ID, always include the wallet relationship
    findAuctionParticipantAuctionByAuctionId(auction_id: string) {
      return this.findOne({
        where: { auction: { auction_id } },
        relations: ["auction", "user"],
      });
    },
    findAllParticipantsByAuctionId(auction_id: string) {
      return this.find({
        where: { auction: { auction_id } },
        relations: ["auction", "user"],
      });
    },
    findAuctionParticipantByUserId(user_id: string) {
      return this.findOne({
        where: { user: { user_id } },
        relations: ["auction", "user"],
      });
    },
    findAuctionParticipantByAuctionIdAndUserId(
      auction_id: string,
      user_id: string,
    ) {
      return this.findOne({
        where: { auction: { auction_id }, user: { user_id } },
        relations: ["auction", "user"],
      });
    },
    isUserParticipatingInAuction(auction_id: string, user_id: string) {
      return this.exists({
        where: { auction: { auction_id }, user: { user_id } },
      });
    },
    findAllAuctionsByUserId(user_id: string) {
      return this.find({
        where: { user: { user_id } },
        relations: ["auction", "user"],
      });
    },
    findAuctionsByParticipantEmailOrUsername(emailOrUsername: string) {
      return this.createQueryBuilder("auctionParticipant")
        .leftJoinAndSelect("auctionParticipant.user", "user")
        .leftJoinAndSelect("auctionParticipant.auction", "auction")
        .where(
          "user.email = :emailOrUsername OR user.username = :emailOrUsername",
          { emailOrUsername },
        )
        .getMany();
    },
    findLatestParticipantByAuctionId(auction_id: string) {
      return this.createQueryBuilder("auctionParticipant")
        .leftJoinAndSelect("auctionParticipant.user", "user")
        .where("auctionParticipant.auction_id = :auction_id", { auction_id })
        .orderBy("auctionParticipant.createdAt", "DESC") // Assuming you have a `createdAt` field
        .getOne();
    },
    findAuctionsWithParticipantCount() {
      return this.createQueryBuilder("auctionParticipant")
        .select("auction.auction_id", "auctionId")
        .addSelect("COUNT(auctionParticipant.user_id)", "participantCount")
        .leftJoin("auctionParticipant.auction", "auction")
        .groupBy("auction.auction_id")
        .getRawMany();
    },
  });

export default auctionParticipantRepository;
