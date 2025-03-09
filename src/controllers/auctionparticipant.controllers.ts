import { Request, Response } from "express";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../utils/response/handleResponse";
import { auctionParticipantService } from "../services/auctionparticipant.service";
import {
  AuthenticatedRequest,
  AuthenticatedRequestHandler,
} from "../types/auth";

export const getAuctionJoinedByUserId: AuthenticatedRequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { user } = req as AuthenticatedRequest;
  const { pagination } = req;
  try {
    const { auctions, count } =
      await auctionParticipantService.getAuctionsByParticipant(
        user.user_id,
        pagination,
      );
    sendSuccessResponse(res, {
      data: auctions,
      count,
      page: pagination.page,
      limit: pagination.limit,
    });
  } catch (error) {
    console.error("Error getting auction joined by user:", error);
    sendErrorResponse(res, "Internal server error");
  }
};
