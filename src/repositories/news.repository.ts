import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource as dataSource } from "../config/data-source";
import { INewsFilter } from "../types/entityfilter";
import { PaginationOptions, applyPagination } from "../utils/pagination";
import { INewsOrder } from "../types/entityorder.types";
import News, { NewsStatus } from "../entities/News";

const applyNewsOrdering = (
  qb: SelectQueryBuilder<News>,
  order?: INewsOrder,
) => {
  if (!order || !order.orderBy) {
    qb.addOrderBy("news.created_at", "DESC");
    return qb;
  }

  if (order.orderBy === "author") {
    qb.orderBy("news.author", order.order);
  }

  if (order.orderBy === "updatedAt") {
    qb.orderBy("news.updatedAt", order.order);
  }

  if (order.orderBy === "title") {
    qb.orderBy("news.title", order.order);
  }

  if (order.orderBy === "status") {
    qb.orderBy("news.status", order.order);
  }

  return qb;
};

// Function to apply filters to the news query
const applyNewsFilters = (
  qb: SelectQueryBuilder<News>,
  filters: INewsFilter = {},
) => {
  if (filters.title) {
    qb.andWhere("news.title ILIKE :title", { title: `%${filters.title}%` });
  }

  if (filters.createdAtFrom) {
    qb.andWhere("news.createdAt >= :createdAtFrom", {
      createdAtFrom: filters.createdAtFrom,
    });
  }

  if (filters.createdAtTo) {
    qb.andWhere("news.updatedAt <= :createdAtTo", {
      createdAtTo: filters.createdAtTo,
    });
  }

  if (filters.status) {
    qb.andWhere("news.status = :status", { status: filters.status });
  } else {
    qb.andWhere("news.status != :status", { status: NewsStatus.PUBLISHED });
  }

  return qb;
};

const createBaseQuery = (repository: Repository<News>) =>
  repository
    .createQueryBuilder("news")
    .withDeleted()
    .leftJoinAndSelect("news.author", "author");

const newsRepository = dataSource.getRepository(News).extend({
  async getAllnews(
    filters?: INewsFilter,
    pagination?: PaginationOptions,
    order?: INewsOrder,
  ) {
    const qb = createBaseQuery(this);

    applyNewsFilters(qb, filters);
    applyNewsOrdering(qb, order);
    applyPagination(qb, pagination);

    const [news, count] = await qb.getManyAndCount();
    return { news, count };
  },
  async findnewsById(news_id: string) {
    const qb = createBaseQuery(this);

    // Add any additional condition for news_id
    qb.where("news.news_id = :news_id", { news_id });

    // Execute the query
    const news = await qb.getOne();

    return news;
  },
});

export default newsRepository;
