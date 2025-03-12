import User from "../entities/User";
import Auction from "../entities/Auction";
import Wallet from "../entities/Wallet";
import Transaction from "../entities/Transaction";
import Bid from "../entities/Bid";
import AuctionParticipant from "../entities/AuctionParticipant";
import Warning from "../entities/Warning";
import Notification from "../entities/Notification";
import News from "../entities/News";

// Define sort order types
export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

// Define the base order interface
export interface IBaseOrder<T extends string> {
  orderBy: T; // Explicit field type or dynamic string field
  order: SortOrder; // Sorting direction (ASC or DESC)
}

// Define allowed ordering fields for User
export type UserOrderFields = keyof User | "balance";
export type AuctionOrderFields = keyof Auction | `user.${keyof User}`;
export type WalletOrderFields = keyof Wallet | `user.${keyof User}`;
export type TransactionOrderFields = keyof Transaction | `user.${keyof User}`;
export type BidOrderFields =
  | keyof Bid
  | `user.${keyof User}`
  | `auction.${keyof Auction}`;
export type AuctionParticipantOrderFields =
  | keyof AuctionParticipant
  | `user.${keyof User}`
  | `auction.${keyof Auction}`;
export type WarningOrderFields = keyof Warning | `user.${keyof User}`;
export type NotificationOrderFields = keyof Notification | `user.${keyof User}`;

export type EntityOrderFields =
  | UserOrderFields
  | AuctionOrderFields
  | WalletOrderFields
  | TransactionOrderFields
  | BidOrderFields
  | AuctionParticipantOrderFields
  | WarningOrderFields
  | NotificationOrderFields;

// Specific order interfaces extending IBaseOrder
export type IUserOrder = IBaseOrder<UserOrderFields>;
export type IAuctionOrder = IBaseOrder<AuctionOrderFields>;
export type IWalletOrder = IBaseOrder<WalletOrderFields>;
export type ITransactionOrder = IBaseOrder<TransactionOrderFields>;
export type IBidOrder = IBaseOrder<keyof Bid>;
export type IAuctionParticipantOrder = IBaseOrder<keyof AuctionParticipant>;
export type IWarningOrder = IBaseOrder<keyof Warning>;
export type INotificationOrder = IBaseOrder<keyof Notification>;
export type INewsOrder = IBaseOrder<keyof News>;
