import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource as dataSource } from "../config/data-source";
import Auction, { AuctionStatus } from "../entities/Auction";
import { IAuctionFilter } from "../types/entityfilter";
import { PaginationOptions, applyPagination } from "../utils/pagination";
import { IAuctionOrder } from "../types/entityorder.types";

const applyAuctionOrdering = (
  qb: SelectQueryBuilder<Auction>,
  order?: IAuctionOrder,
) => {
  if (!order || !order.orderBy) {
    qb.addOrderBy("auction.created_at", "DESC");
    return qb;
  }

  if (order.orderBy === "start_datetime") {
    qb.orderBy("auction.start_datetime", order.order);
  }

  if (order.orderBy === "end_datetime") {
    qb.orderBy("auction.end_datetime", order.order);
  }

  if (order.orderBy === "reserve_price") {
    qb.orderBy("auction.reserve_price", order.order);
  }

  if (order.orderBy === "created_at") {
    qb.orderBy("auction.created_at", order.order);
  }

  if (order.orderBy === "updated_at") {
    qb.orderBy("auction.updated_at", order.order);
  }

  if (order.orderBy === "current_highest_bid") {
    qb.orderBy("auction.current_highest_bid", order.order);
  }

  return qb;
};

// Function to apply filters to the Auction query
const applyAuctionFilters = (
  qb: SelectQueryBuilder<Auction>,
  filters: IAuctionFilter = {},
) => {
  if (filters.title) {
    qb.andWhere("auction.title ILIKE :title", { title: `%${filters.title}%` });
  }

  if (filters.description) {
    qb.andWhere("auction.description ILIKE :description", {
      description: `%${filters.description}%`,
    });
  }

  if (filters.minReservePrice !== undefined) {
    qb.andWhere("auction.reserve_price >= :minReservePrice", {
      minReservePrice: filters.minReservePrice,
    });
  }

  if (filters.maxReservePrice !== undefined) {
    qb.andWhere("auction.reserve_price <= :maxReservePrice", {
      maxReservePrice: filters.maxReservePrice,
    });
  }

  if (filters.startDateFrom) {
    qb.andWhere("auction.start_datetime >= :startDateFrom", {
      startDateFrom: filters.startDateFrom,
    });
  }

  if (filters.startDateTo) {
    qb.andWhere("auction.start_datetime <= :startDateTo", {
      startDateTo: filters.startDateTo,
    });
  }

  if (filters.status) {
    qb.andWhere("auction.status = :status", { status: filters.status });
  } else {
    qb.andWhere("auction.status != :status", { status: AuctionStatus.DELETED });
  }

  return qb;
};

const createBaseQuery = (repository: Repository<Auction>) =>
  repository
    .createQueryBuilder("auction")
    .withDeleted()
    .leftJoin("auction.user", "user")
    .addSelect(["user.user_id", "user.username"])
    .leftJoinAndSelect("auction.bids", "bids")
    .leftJoin("bids.user", "bid_user")
    .addSelect(["bid_user.user_id", "bid_user.username"])
    .leftJoinAndSelect("auction.participants", "participants")
    .leftJoin("participants.user", "participant_user")
    .addSelect(["participant_user.user_id", "participant_user.username"]);

const auctionRepository = dataSource.getRepository(Auction).extend({
  async getAllAuctions(
    filters?: IAuctionFilter,
    pagination?: PaginationOptions,
    order?: IAuctionOrder,
  ) {
    const qb = createBaseQuery(this);

    applyAuctionFilters(qb, filters);
    applyAuctionOrdering(qb, order);
    applyPagination(qb, pagination);

    const [auctions, count] = await qb.getManyAndCount();
    return { auctions, count };
  },
  async findAuctionById(auction_id: string) {
    const qb = createBaseQuery(this);

    // Add any additional condition for auction_id
    qb.where("auction.auction_id = :auction_id", { auction_id });

    // Execute the query
    const auction = await qb.getOne();

    if (auction) {
      // Fix: Count participants directly from auction_participant table
      const participantsCount = await this.createQueryBuilder("auction")
        .select("COUNT(participants.auction_participant_id)", "count")
        .leftJoin("auction.participants", "participants")
        .where("auction.auction_id = :auction_id", { auction_id })
        .getRawOne()
        .then((result) => Number(result.count));

      auction.participants_count = participantsCount;
    }

    return auction;
  },

  async findAuctionWithBids(auction_id: string) {
    const qb = this.createQueryBuilder("auction")
      .leftJoinAndSelect("auction.bids", "bids")
      .where("auction.auction_id = :auction_id", { auction_id });

    // Await the query result
    const auction = await qb.getOne();
    return auction;
  },
});

export default auctionRepository;
