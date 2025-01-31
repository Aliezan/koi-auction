import { Request, Response, NextFunction } from "express";
import { validate, isDateString } from "class-validator";
import Auction from "../../entities/Auction";
import auctionRepository from "../../repositories/auction.repository";

const createAuctionValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Missing request body!" });
      return;
    }

    const {
      item,
      title,
      description,
      reserve_price,
      start_datetime,
      end_datetime,
      bid_increment,
    } = req.body;

    // Validate item_id (must be a valid UUID and the item should exist)
    if (!item) {
      res.status(400).json({ message: "Invalid item!" });
      return;
    }

    const itemAlreadyExist = await auctionRepository.findOne({
      where: { item },
    });

    if (itemAlreadyExist) {
      res.status(400).json({ message: "Item already has an auction!" });
      return;
    }

    // Validate required fields: title, description
    if (!title || title.trim().length === 0) {
      res.status(400).json({ message: "Title must not be empty!" });
      return;
    }
    if (!description || description.trim().length === 0) {
      res.status(400).json({ message: "Description must not be empty!" });
      return;
    }

    // Ensure reserve_price is a valid positive number, if provided
    let parsedReservePrice = reserve_price;
    if (reserve_price !== undefined && typeof reserve_price === "string") {
      parsedReservePrice = Number(reserve_price);
    }

    if (
      parsedReservePrice !== undefined &&
      (Number.isNaN(parsedReservePrice) || parsedReservePrice <= 0)
    ) {
      res
        .status(400)
        .json({ message: "Reserve price must be a valid positive number!" });
      return;
    }

    // Validate start_datetime and end_datetime (ensure they are valid dates)
    if (!start_datetime || !isDateString(start_datetime)) {
      res.status(400).json({ message: "Invalid start datetime!" });
      return;
    }
    if (!end_datetime || !isDateString(end_datetime)) {
      res.status(400).json({ message: "Invalid end datetime!" });
      return;
    }

    // Ensure start datetime is in the future
    const startDt = new Date(start_datetime);
    if (startDt.getTime() <= new Date().getTime()) {
      res
        .status(400)
        .json({ message: "Start datetime must be in the future!" });
      return;
    }

    // Ensure end datetime is after start datetime
    const endDt = new Date(end_datetime);
    if (endDt.getTime() <= startDt.getTime()) {
      res
        .status(400)
        .json({ message: "End datetime must be after start datetime!" });
      return;
    }

    // UTC-7 Time Zone Offset (7 hours in milliseconds)
    const timezoneOffset = 7 * 60 * 60 * 1000;

    // Adjust start datetime to UTC-7
    startDt.setTime(startDt.getTime() - timezoneOffset);

    // Adjust end datetime to UTC-7
    endDt.setTime(endDt.getTime() - timezoneOffset);

    if (startDt.getTime() <= new Date().getTime()) {
      res
        .status(400)
        .json({ message: "Start datetime must be in the future!" });
      return;
    }

    if (endDt.getTime() <= new Date().getTime()) {
      res.status(400).json({ message: "End datetime must be in the future!" });
      return;
    }

    // Validate bid_increment
    let parsedBidIncrement = bid_increment;
    if (bid_increment !== undefined && typeof bid_increment === "string") {
      parsedBidIncrement = Number(bid_increment);
    }

    if (
      parsedBidIncrement !== undefined &&
      (Number.isNaN(parsedBidIncrement) || parsedBidIncrement <= 0)
    ) {
      res
        .status(400)
        .json({ message: "Bid increment must be a valid positive number!" });
      return;
    }

    // Create Auction object and set fields
    const auction = new Auction();
    auction.title = title;
    auction.description = description;
    auction.reserve_price =
      parsedReservePrice !== undefined ? parsedReservePrice : null;
    auction.start_datetime = startDt;
    auction.end_datetime = endDt;
    auction.item = item;
    auction.bid_increment = parsedBidIncrement;

    // Validate auction instance
    const errors = await validate(auction, { skipMissingProperties: true });
    if (errors.length > 0) {
      res.status(400).json({
        message: "Validation failed",
        errors: errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        })),
      });
      return;
    }

    // Proceed to the next middleware if validation passes
    next();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export default createAuctionValidator;
