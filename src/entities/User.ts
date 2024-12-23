import {
  IsEmail,
  IsEnum,
  IsNumber,
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
} from "typeorm";

import Auction from "./Auction";
import Bid from "./Bid";
import Item from "./Item";

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

  @IsNumber()
  @Column({ default: 0 })
  declare balance: number;

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

  // One-to-many relationship with Item (as a parent)
  @OneToMany(() => Item, (item) => item.user)
  declare items: Item[] | null;
}

export default User;
