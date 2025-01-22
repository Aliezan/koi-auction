import { AuctionStatus } from "../entities/Auction";
import { TransactionStatus } from "../entities/Transaction";

export interface IBaseFilter {
  createdAtFrom?: Date; // Filter by creation date (earliest)
  createdAtTo?: Date; // Filter by creation date (latest)
}

// Declaration for entity filters, used in repositories
export interface IUserFilter extends IBaseFilter {
  username?: string; // Filter by username
  email?: string; // Filter by email
  role?: string; // Filter by user role
  registrationDateFrom?: Date; // Filter by registration start date
  registrationDateTo?: Date; // Filter by registration end date
}

export interface IAuctionFilter extends IBaseFilter {
  title?: string; // Filter by auction title
  description?: string; // Filter by auction description
  minReservePrice?: number; // Filter by minimum reserve price
  maxReservePrice?: number; // Filter by maximum reserve price
  startDateFrom?: Date; // Filter by auction start date (earliest)
  startDateTo?: Date; // Filter by auction start date (latest)
  status?: AuctionStatus;
}

export interface IWalletFilter extends IBaseFilter {
  userId?: string; // Filter wallets by user ID
  balanceMin?: number; // Filter wallets with balance above a certain value
  balanceMax?: number; // Filter wallets with balance below a certain value
  walletId?: string; // Filter by specific wallet ID
}

export interface ITransactionFilter extends IBaseFilter {
  walletId?: string; // Filter transactions by wallet ID
  amountMin?: number; // Filter transactions with amount greater than or equal to a value
  amountMax?: number; // Filter transactions with amount less than or equal to a value
  transactionId?: string; // Filter by specific transaction ID
  status?: TransactionStatus; // Filter by transaction status
}

export interface IBidFilter extends IBaseFilter {
  bidAmountMin?: number; // Minimum bid amount
  bidAmountMax?: number; // Maximum bid amount
  bidTimeFrom?: Date; // Start date for filtering bids by time
  bidTimeTo?: Date; // End date for filtering bids by time
  userId?: string; // Filter bids by a specific user ID
  auctionId?: string; // Filter bids by a specific auction ID
}
