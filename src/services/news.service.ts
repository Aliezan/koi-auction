import News from "../entities/News";
import newsRepository from "../repositories/news.repository";
import { INewsFilter } from "../types/entityfilter";
import { INewsOrder } from "../types/entityorder.types";
import { PaginationOptions } from "../utils/pagination";

// Generate slug from title
const generateSlug = (title: string) => title.toLowerCase().replace(/ /g, "-");

export const getAllNews = async (
  filters?: INewsFilter,
  pagination?: PaginationOptions,
  order?: INewsOrder,
) => {
  const { news, count } = await newsRepository.getAllnews(
    filters,
    pagination,
    order,
  );
  return { news, count };
};

export const getNewsById = async (news_id: string) => {
  const news = await newsRepository.findnewsById(news_id);
  return news;
};

export const createNews = async (news: News) => {
  const newsCopy = { ...news, slug: generateSlug(news.title) };
  const newNews = await newsRepository.save(newsCopy);
  return newNews;
};

export const updateNews = async (news_id: string, news: News) => {
  const existingNews = await newsRepository.findnewsById(news_id);
  const newsCopy = { ...news };
  if (existingNews?.title !== news.title) {
    newsCopy.slug = generateSlug(news.title);
  }

  const updatedNews = await newsRepository.update(news_id, newsCopy);
  return updatedNews;
};
