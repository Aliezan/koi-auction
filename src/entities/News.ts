import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import User from "./User";

@Entity()
export class News {
  @PrimaryGeneratedColumn()
  declare id: number;

  @Column()
  declare title: string;

  @Column("text")
  declare description: string;

  @Column()
  declare mainImage: string;

  @Column("text")
  declare paragraph: string;

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
