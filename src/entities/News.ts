import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { IsEnum } from "class-validator";
import User from "./User";

export enum NewsStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

@Entity()
class News {
  @PrimaryGeneratedColumn()
  declare id: number;

  @Column()
  declare title: string;

  @Column()
  declare slug: string;

  @Column("text")
  declare description: string;

  @Column()
  declare mainImage: string;

  @Column("text")
  declare paragraph: string;

  @Column({
    type: "enum",
    enum: NewsStatus,
    default: NewsStatus.DRAFT,
  })
  @IsEnum(NewsStatus)
  declare status: NewsStatus;

  @ManyToOne(() => User, (user) => user.news, {
    nullable: false,
    onDelete: "CASCADE",
  })
  declare author: User;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}

export default News;
