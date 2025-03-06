import { AppDataSource } from "../config/data-source";
import Auction, { AuctionStatus } from "../entities/Auction";
import { Job } from "../entities/Job";
import auctionRepository from "../repositories/auction.repository";
import { auctionEmitter } from "../sockets/auction.socket";
import JobManager, { JobHandler } from "./jobManager";
// import { auctionService } from "../services/auction.service";
// import { notificationService } from "../services/notification.service";
// import { NotificationType } from "../entities/Notification";

const jobManager = new JobManager();
const jobRepository = AppDataSource.getRepository(Job);

// Define the auction start handler
const auctionStartHandler: JobHandler = {
  execute: async (job): Promise<{ success: boolean; error?: Error }> => {
    try {
      const auctionToUpdate = await auctionRepository.findOneBy({
        auction_id: job.referenceId,
      });

      if (
        !auctionToUpdate ||
        auctionToUpdate.status !== AuctionStatus.PUBLISHED
      ) {
        throw new Error(
          `Auction [${job.referenceId}] not found or not in PUBLISHED state`,
        );
      }

      auctionToUpdate.status = AuctionStatus.STARTED;
      await auctionRepository.save(auctionToUpdate);
      console.log(`Auction [${auctionToUpdate.auction_id}] started.`);
      // Notify via socket
      await auctionEmitter.auctionUpdate(
        "AUCTION_UPDATED",
        auctionToUpdate.auction_id,
        auctionToUpdate,
      );

      return { success: true };
    } catch (error) {
      console.error(
        `Error while starting auction [${job.referenceId}]:`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
};

const auctionEndHandler: JobHandler = {
  execute: async (job): Promise<{ success: boolean; error?: Error }> => {
    try {
      const auction = await auctionRepository.findAuctionById(job.referenceId);

      if (!auction || auction.status !== AuctionStatus.STARTED) {
        throw new Error(
          `Auction [${job.referenceId}] not found or not in STARTED state`,
        );
      }

      auction.status = AuctionStatus.PENDING;
      await auctionRepository.save(auction);

      await auctionEmitter.auctionUpdate(
        "AUCTION_UPDATED",
        auction.auction_id,
        auction,
      );

      return { success: true };
    } catch (error) {
      console.error(`Error while ending auction [${job.referenceId}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
};

// Register the handler
jobManager.registerJobHandler("start-auction", auctionStartHandler);
jobManager.registerJobHandler("end-auction", auctionEndHandler);

/**
 * Schedule an auction start job.
 * @param auction The auction entity.
 */
export const schedule = async (auction: Auction): Promise<void> => {
  if (!auction.start_datetime || !auction.auction_id) {
    console.log(
      `Invalid auction data: ${auction.auction_id} or ${auction.start_datetime}`,
    );
    return;
  }

  try {
    // Schedule the start job
    await jobManager.createJob(
      auction.auction_id,
      "start-auction",
      auction.start_datetime,
      "auction",
    );

    console.log(`Scheduled start job for auction [${auction.auction_id}]`);
  } catch (error) {
    console.error("Error scheduling auction job:", error);
    throw error;
  }
};

export const scheduleEndJob = async (auction: Auction): Promise<void> => {
  if (!auction.end_datetime || !auction.auction_id) {
    console.log(
      `Invalid auction data: ${auction.auction_id} or ${auction.end_datetime}`,
    );
    return;
  }

  try {
    // Schedule the end job
    await jobManager.createJob(
      auction.auction_id,
      "end-auction",
      auction.end_datetime,
      "auction",
    );

    console.log(`Scheduled end job for auction [${auction.auction_id}]`);
  } catch (error) {
    console.error("Error scheduling auction job:", error);
    throw error;
  }
};

/**
 * Cancel all jobs (start and end) associated with an auction.
 * @param auctionId Auction ID.
 */
export const cancel = async (auctionId: string) => {
  const jobs = await jobRepository.find({
    where: { referenceId: auctionId },
  });

  if (jobs.length > 0) {
    await Promise.all(jobs.map((job) => jobManager.cancelJob(job.id)));
    console.log(`Canceled ${jobs.length} jobs for auction [${auctionId}]`);
  } else {
    console.log(`No jobs found for auction [${auctionId}]`);
  }
};

/**
 * Initialize all scheduled auction jobs.
 */
export const initializeAuctionJobs = async () => {
  try {
    const auctionsToStart = await auctionRepository.find({
      where: { status: AuctionStatus.PUBLISHED },
    });
    const auctionsToEnd = await auctionRepository.find({
      where: { status: AuctionStatus.STARTED },
    });

    await Promise.all([
      ...auctionsToStart.map((auction) => schedule(auction)),
      ...auctionsToEnd.map((auction) => scheduleEndJob(auction)),
    ]);

    console.log(`Scheduled ${auctionsToStart.length} auctions to start.`);
    console.log(`Scheduled ${auctionsToEnd.length} auctions to end.`);
  } catch (error) {
    console.error("Error initializing auction jobs:", error);
  }
};

export const auctionJobs = {
  schedule,
  scheduleEndJob,
  cancel,
  initializeAuctionJobs,
};
