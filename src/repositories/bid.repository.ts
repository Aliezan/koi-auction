import { SelectQueryBuilder } from "typeorm";
import { AppDataSource as dataSource } from "../config/data-source";
import Bid from "../entities/Bid";
import { IBidFilter } from "../types/entityfilter";
import { PaginationOptions } from "../utils/pagination";
import { IBidOrder } from "../types/entityorder.types";

const applyBidOrdering = (qb: SelectQueryBuilder<Bid>, order?: IBidOrder) => {
  if (!order || !order.orderBy) {
    qb.addOrderBy("bid.bid_time", "DESC");
    return qb;
  }

  if (order.orderBy === "bid_time") {
    qb.orderBy("bid.bid_time", order.order);
  }

  if (order.orderBy === "bid_amount") {
    qb.orderBy("bid.bid_amount", order.order);
  }

  return qb;
};

// Helper function to apply common filters
const applyBidFilters = (
  qb: SelectQueryBuilder<Bid>,
  filters: IBidFilter = {},
) => {
  if (filters.bidAmountMin !== undefined) {
    qb.andWhere("bid.bid_amount >= :bidAmountMin", {
      bidAmountMin: filters.bidAmountMin,
    });
  }

  if (filters.bidAmountMax !== undefined) {
    qb.andWhere("bid.bid_amount <= :bidAmountMax", {
      bidAmountMax: filters.bidAmountMax,
    });
  }

  if (filters.bidTimeFrom) {
    qb.andWhere("bid.bid_time >= :bidTimeFrom", {
      bidTimeFrom: filters.bidTimeFrom,
    });
  }

  if (filters.bidTimeTo) {
    qb.andWhere("bid.bid_time <= :bidTimeTo", {
      bidTimeTo: filters.bidTimeTo,
    });
  }

  if (filters.userId) {
    qb.andWhere("bid.user_id = :userId", {
      userId: filters.userId,
    });
  }

  if (filters.auctionId) {
    qb.andWhere("bid.auction_id = :auctionId", {
      auctionId: filters.auctionId,
    });
  }
  return qb;
};

// Helper function to apply pagination
const applyPagination = (
  queryBuilder: SelectQueryBuilder<Bid>,
  pagination?: PaginationOptions,
) => {
  if (pagination) {
    const { page = 1, limit = 10 } = pagination;
    queryBuilder.skip((page - 1) * limit).take(limit);
  }
};

// Extend the base repository with additional methods
const bidRepository = dataSource.getRepository(Bid).extend({
  async findAllAndCount(
    filters?: IBidFilter,
    pagination?: PaginationOptions,
    order?: IBidOrder,
  ) {
    const qb = this.createQueryBuilder("bid")
      .leftJoinAndSelect("bid.auction", "auction")
      .leftJoinAndSelect("bid.user", "user") // FIXED: Use leftJoinAndSelect
      .select([
        "bid",
        "auction.auction_id",
        "user.user_id",
        "user.username",
        "user.email",
      ]);
    // Apply filters
    applyBidFilters(qb, filters);
    // Apply ordering
    applyBidOrdering(qb, order);
    // Apply pagination
    applyPagination(qb, pagination);

    const [bids, count] = await qb.getManyAndCount();

    return { bids, count };
  },

  async findBidById(bid_id: string) {
    return this.findOne({
      where: { bid_id },
      relations: ["auction", "user"],
    });
  },

  async findBidByAuctionId(
    auction_id: string,
    filters?: Omit<IBidFilter, "auctionId">,
    pagination?: PaginationOptions,
    order?: IBidOrder,
  ) {
    const qb = this.createQueryBuilder("bid")
      .leftJoinAndSelect("bid.auction", "auction")
      .leftJoinAndSelect("bid.user", "user") // FIXED: Use leftJoinAndSelect
      .select(["bid", "auction", "user.user_id", "user.username", "user.email"])
      .where("auction.auction_id = :auction_id", { auction_id });

    // Apply filters
    if (filters) {
      applyBidFilters(qb, filters);
    }

    applyBidOrdering(qb, order);

    // Apply pagination
    applyPagination(qb, pagination);
    const [bids, count] = await qb.getManyAndCount();
    return { bids, count };
  },

  async findBidByUserId(
    user_id: string,
    filters?: Omit<IBidFilter, "userId">,
    pagination?: PaginationOptions,
  ) {
    const queryBuilder = this.createQueryBuilder("bid")
      .leftJoinAndSelect("bid.auction", "auction")
      .leftJoinAndSelect("bid.user", "user")
      .where("bid.user_id = :user_id", { user_id }); // FIXED: Reference bid.user_id

    // Apply filters
    if (filters) {
      applyBidFilters(queryBuilder, filters);
    }

    // Apply pagination
    applyPagination(queryBuilder, pagination);
    const [bids, count] = await queryBuilder.getManyAndCount();
    return { bids, count };
  },

  async getHighestBid(auction_id: string): Promise<Bid | null> {
    return this.createQueryBuilder("bid")
      .where("bid.auction_id = :auction_id", { auction_id })
      .leftJoinAndSelect("bid.auction", "auction")
      .leftJoinAndSelect("bid.user", "user")
      .orderBy("bid.bid_amount", "DESC")
      .addOrderBy("bid.bid_time", "ASC") // If two bids have the same amount, prioritize the earlier one
      .getOne();
  },
});

export default bidRepository;
