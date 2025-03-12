import {
  IsEmail,
  IsEnum,
  IsPhoneNumber,
  IsString,
  MinLength,
} from "class-validator";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";

import Auction from "./Auction";
import Bid from "./Bid";
import Wallet from "./Wallet";
import AuctionParticipant from "./AuctionParticipant";
import Notification from "./Notification";
import Warning from "./Warning";
import News from "./News";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

@Entity()
class User {
  @PrimaryGeneratedColumn("uuid")
  declare user_id: string;

  @IsString()
  @Column()
  declare username: string;

  @IsEnum(UserRole)
  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  declare role: UserRole;

  @IsEmail()
  @Column()
  declare email: string;

  @MinLength(8)
  @Column()
  declare password: string;

  @IsPhoneNumber("ID", {
    message:
      "Phone number must be a valid Indonesian number starting with +62, 62, or 0",
  })
  @Column("varchar", {
    nullable: true,
    unique: true,
  })
  declare phone: string;

  @CreateDateColumn()
  declare registration_date: Date;

  @UpdateDateColumn()
  declare last_update: Date;

  // One-to-many relationship with Auction (as a parent) that represents the creator of the auction (admin) as a child
  @OneToMany(() => Auction, (auction) => auction.user)
  declare auctions: Auction[] | null;

  // One-to-many relationship with Bid (as a parent)
  @OneToMany(() => Bid, (bid) => bid.user)
  declare bids: Bid[] | null;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  declare wallet: Wallet | null;

  @OneToMany(
    () => AuctionParticipant,
    (auctionParticipant) => auctionParticipant.user,
  )
  declare auctionsParticipants: AuctionParticipant[]; // Reference the AuctionParticipant entity

  @OneToMany(() => Notification, (notification) => notification.user)
  declare notifications: Notification[];

  @Column({ default: false })
  declare is_banned: boolean;

  @OneToMany(() => Warning, (warning) => warning.user)
  declare warnings: Warning[];

  @OneToMany(() => News, (news) => news.author, { cascade: true })
  declare news: News[];
}

export default User;
