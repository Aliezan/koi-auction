import { Request, Response, NextFunction } from "express";
import { validate, isDateString } from "class-validator";
import { In, Not } from "typeorm";
import auctionRepository from "../../repositories/auction.repository";
import { AuctionStatus } from "../../entities/Auction";
import { ErrorHandler } from "../../utils/response/handleError";

interface UpdateAuctionData {
  item?: string;
  title?: string;
  description?: string;
  buynow_price?: number | null;
  bid_increment?: number | null;
  start_datetime?: Date;
  end_datetime?: Date;
  participation_fee?: number | null;
  status?: AuctionStatus;
}

const validateField = async <T>(
  value: T,
  validator: (value: T) => Promise<boolean> | boolean,
  errorMessage: string,
): Promise<T | undefined> => {
  if (value !== undefined && !(await validator(value))) {
    throw ErrorHandler.badRequest(errorMessage);
  }
  return value;
};

const updateAuctionValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw ErrorHandler.badRequest(
        "At least one field must be provided for update",
      );
    }

    const { auction_id } = req.params;
    if (!auction_id) {
      throw ErrorHandler.badRequest("Invalid auction ID");
    }

    const existingAuction = await auctionRepository.findAuctionById(auction_id);
    if (!existingAuction) {
      throw ErrorHandler.notFound("Auction not found");
    }

    const updates: Partial<UpdateAuctionData> = {};

    // Validate item
    if ("item" in req.body) {
      const { item } = req.body;
      if (item !== existingAuction.item) {
        const itemExists = await auctionRepository.findOne({
          where: {
            item,
            status: Not(
              In([
                AuctionStatus.DELETED,
                AuctionStatus.CANCELLED,
                AuctionStatus.EXPIRED,
                AuctionStatus.FAILED,
              ]),
            ),
          },
          withDeleted: true,
        });

        if (itemExists) {
          throw ErrorHandler.badRequest("Item already has an auction");
        }
        updates.item = item;
      }
    }

    // Validate title and description
    updates.title = await validateField(
      req.body.title,
      (val) => typeof val === "string" && val.trim().length > 0,
      "Title must not be empty",
    );
    updates.description = await validateField(
      req.body.description,
      (val) => typeof val === "string" && val.trim().length > 0,
      "Description must not be empty",
    );

    // Validate buynow_price
    if ("buynow_price" in req.body) {
      const price =
        req.body.buynow_price === null ? null : Number(req.body.buynow_price);
      if (price !== null) {
        await validateField(
          price,
          (val) => !Number.isNaN(val) && val > 0,
          "Reserve price must be a valid positive number",
        );
      }
      updates.buynow_price = price;
    }

    // Validate buynow_price
    if ("participation_fee" in req.body) {
      const price =
        req.body.participation_fee === null
          ? null
          : Number(req.body.participation_fee);
      if (price !== null) {
        await validateField(
          price,
          (val) => !Number.isNaN(val) && val > 0,
          "Reserve price must be a valid positive number",
        );
      }
      updates.participation_fee = price;
    }

    // Validate bid_increment
    if ("bid_increment" in req.body) {
      const increment =
        req.body.bid_increment === null ? null : Number(req.body.bid_increment);
      if (increment !== null) {
        await validateField(
          increment,
          (val) => !Number.isNaN(val) && val > 0,
          "Bid increment must be a valid positive number",
        );
      }
      updates.bid_increment = increment;
    }

    // Validate start_datetime
    if ("start_datetime" in req.body) {
      const startDate = new Date(req.body.start_datetime);
      await validateField(
        req.body.start_datetime,
        (val) => isDateString(val) && startDate > new Date(),
        "Start datetime must be a valid future date",
      );
      updates.start_datetime = startDate;
    }

    // Validate end_datetime
    if ("end_datetime" in req.body) {
      const endDate = new Date(req.body.end_datetime);
      await validateField(
        req.body.end_datetime,
        (val) => {
          const startTime =
            updates.start_datetime || existingAuction.start_datetime;
          return isDateString(val) && endDate > startTime;
        },
        "End datetime must be after start datetime",
      );
      updates.end_datetime = endDate;
    }

    // Validate status
    if ("status" in req.body) {
      const status = req.body.status.toUpperCase() as AuctionStatus;
      await validateField(
        status,
        (val) => Object.values(AuctionStatus).includes(val),
        "Invalid auction status",
      );
      updates.status = status;
    }

    // Create a clean auction object with only updatable fields
    const updatedAuction = Object.assign(auctionRepository.create(), updates);

    // Validate only the updated properties
    const validationErrors = await validate(updatedAuction, {
      skipMissingProperties: true,
      skipUndefinedProperties: true,
    });

    if (validationErrors.length > 0) {
      throw ErrorHandler.badRequest("Validation Failed", validationErrors);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default updateAuctionValidator;
