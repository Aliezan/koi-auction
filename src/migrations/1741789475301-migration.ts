import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1741789475301 implements MigrationInterface {
  name = "Migration1741789475301";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`bid\` (\`bid_id\` varchar(36) NOT NULL, \`bid_amount\` decimal NOT NULL, \`bid_time\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, \`auction_id\` varchar(36) NULL, PRIMARY KEY (\`bid_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`auction_participant\` (\`auction_participant_id\` varchar(36) NOT NULL, \`joined_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`auction_id\` varchar(36) NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`auction_participant_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`auction\` (\`auction_id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL DEFAULT 'Auction Title', \`description\` text NOT NULL, \`rich_description\` longtext NULL, \`item\` varchar(255) NOT NULL, \`start_datetime\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`end_datetime\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`status\` enum ('DRAFT', 'PENDING', 'PUBLISHED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'FAILED', 'STARTED', 'DELETED') NOT NULL DEFAULT 'DRAFT', \`current_highest_bid\` decimal(10,2) NULL, \`buynow_price\` decimal(10,2) NULL, \`participation_fee\` decimal(10,2) NOT NULL DEFAULT '0.00', \`bid_increment\` decimal(10,2) NOT NULL DEFAULT '50000.00', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`highest_bid_id\` varchar(255) NULL, \`winner_id\` varchar(255) NULL, \`final_price\` decimal(10,2) NULL, \`created_by_id\` varchar(36) NULL, UNIQUE INDEX \`REL_20dc669aa93dfa9bc829d8530f\` (\`highest_bid_id\`), PRIMARY KEY (\`auction_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`transaction\` (\`transaction_id\` varchar(36) NOT NULL, \`admin_id\` varchar(255) NULL, \`amount\` decimal(12,2) NOT NULL, \`type\` enum ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PARTICIPATE', 'REFUND') NOT NULL, \`status\` enum ('PENDING', 'COMPLETED', 'FAILED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING', \`proof_of_payment\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`wallet_id\` varchar(36) NULL, PRIMARY KEY (\`transaction_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`wallet\` (\`wallet_id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`balance\` decimal(12,2) NOT NULL DEFAULT '0.00', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`REL_72548a47ac4a996cd254b08252\` (\`user_id\`), PRIMARY KEY (\`wallet_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`notification\` (\`notification_id\` varchar(36) NOT NULL, \`type\` enum ('BID', 'AUCTION', 'SYSTEM', 'TRANSACTION') NOT NULL, \`message\` text NULL, \`reference_id\` varchar(255) NULL, \`status\` enum ('PENDING', 'UNREAD', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'UNREAD', \`role\` enum ('ADMIN', 'USER') NOT NULL DEFAULT 'USER', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`notification_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`warning\` (\`warning_id\` varchar(36) NOT NULL, \`reason\` varchar(255) NOT NULL, \`status\` enum ('ACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userUserId\` varchar(36) NULL, \`adminUserId\` varchar(36) NULL, PRIMARY KEY (\`warning_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`news\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`mainImage\` varchar(255) NOT NULL, \`paragraph\` text NOT NULL, \`status\` enum ('draft', 'published') NOT NULL DEFAULT 'draft', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`authorUserId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`user_id\` varchar(36) NOT NULL, \`username\` varchar(255) NOT NULL, \`role\` enum ('admin', 'user') NOT NULL DEFAULT 'user', \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`phone\` varchar(255) NULL, \`registration_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`last_update\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`is_banned\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_8e1f623798118e629b46a9e629\` (\`phone\`), PRIMARY KEY (\`user_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`wishlists\` (\`wishlist_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` varchar(255) NOT NULL, \`auction_id\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_45343361615de62b2f158f79bf\` (\`user_id\`, \`auction_id\`), PRIMARY KEY (\`wishlist_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`jobs\` (\`id\` varchar(36) NOT NULL, \`runAt\` timestamp NOT NULL, \`jobType\` varchar(255) NOT NULL, \`status\` enum ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'MAINTENANCE_QUEUED', 'CANCELLED', 'RETRY_QUEUED') NOT NULL DEFAULT 'PENDING', \`referenceId\` varchar(255) NOT NULL, \`entity\` varchar(255) NOT NULL, \`retryCount\` int NOT NULL DEFAULT '0', \`lastError\` varchar(255) NULL, \`jobConfig\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bid\` ADD CONSTRAINT \`FK_2abdf07c084ae99935e6506d06e\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bid\` ADD CONSTRAINT \`FK_9e594e5a61c0f3cb25679f6ba8d\` FOREIGN KEY (\`auction_id\`) REFERENCES \`auction\`(\`auction_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction_participant\` ADD CONSTRAINT \`FK_9d4335b4fc0e2e7867a4dc902e0\` FOREIGN KEY (\`auction_id\`) REFERENCES \`auction\`(\`auction_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction_participant\` ADD CONSTRAINT \`FK_959b52f79270decf318a585147b\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction\` ADD CONSTRAINT \`FK_d6d1d5a66a4721b9b1a259557c6\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction\` ADD CONSTRAINT \`FK_20dc669aa93dfa9bc829d8530fe\` FOREIGN KEY (\`highest_bid_id\`) REFERENCES \`bid\`(\`bid_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction\` ADD CONSTRAINT \`FK_7b44e48cf5002fffcf0f1b648d1\` FOREIGN KEY (\`winner_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_08081d10759ec250c557cebd81a\` FOREIGN KEY (\`wallet_id\`) REFERENCES \`wallet\`(\`wallet_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_9ebef6fe1344f83ea266c0914c1\` FOREIGN KEY (\`admin_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallet\` ADD CONSTRAINT \`FK_72548a47ac4a996cd254b082522\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_928b7aa1754e08e1ed7052cb9d8\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`warning\` ADD CONSTRAINT \`FK_7d74353e977f8723df1b5737eb9\` FOREIGN KEY (\`userUserId\`) REFERENCES \`user\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`warning\` ADD CONSTRAINT \`FK_8b43983d34652b89ddc1995fca2\` FOREIGN KEY (\`adminUserId\`) REFERENCES \`user\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`news\` ADD CONSTRAINT \`FK_e69560c1b2746accbac863c5aa5\` FOREIGN KEY (\`authorUserId\`) REFERENCES \`user\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wishlists\` ADD CONSTRAINT \`FK_b5e6331a1a7d61c25d7a25cab8f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wishlists\` ADD CONSTRAINT \`FK_1ff60f594a3d51cdc9fbc18dbc9\` FOREIGN KEY (\`auction_id\`) REFERENCES \`auction\`(\`auction_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`wishlists\` DROP FOREIGN KEY \`FK_1ff60f594a3d51cdc9fbc18dbc9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`wishlists\` DROP FOREIGN KEY \`FK_b5e6331a1a7d61c25d7a25cab8f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`news\` DROP FOREIGN KEY \`FK_e69560c1b2746accbac863c5aa5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`warning\` DROP FOREIGN KEY \`FK_8b43983d34652b89ddc1995fca2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`warning\` DROP FOREIGN KEY \`FK_7d74353e977f8723df1b5737eb9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_928b7aa1754e08e1ed7052cb9d8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallet\` DROP FOREIGN KEY \`FK_72548a47ac4a996cd254b082522\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_9ebef6fe1344f83ea266c0914c1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_08081d10759ec250c557cebd81a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction\` DROP FOREIGN KEY \`FK_7b44e48cf5002fffcf0f1b648d1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction\` DROP FOREIGN KEY \`FK_20dc669aa93dfa9bc829d8530fe\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction\` DROP FOREIGN KEY \`FK_d6d1d5a66a4721b9b1a259557c6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction_participant\` DROP FOREIGN KEY \`FK_959b52f79270decf318a585147b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction_participant\` DROP FOREIGN KEY \`FK_9d4335b4fc0e2e7867a4dc902e0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bid\` DROP FOREIGN KEY \`FK_9e594e5a61c0f3cb25679f6ba8d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bid\` DROP FOREIGN KEY \`FK_2abdf07c084ae99935e6506d06e\``,
    );
    await queryRunner.query(`DROP TABLE \`jobs\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_45343361615de62b2f158f79bf\` ON \`wishlists\``,
    );
    await queryRunner.query(`DROP TABLE \`wishlists\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8e1f623798118e629b46a9e629\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP TABLE \`news\``);
    await queryRunner.query(`DROP TABLE \`warning\``);
    await queryRunner.query(`DROP TABLE \`notification\``);
    await queryRunner.query(
      `DROP INDEX \`REL_72548a47ac4a996cd254b08252\` ON \`wallet\``,
    );
    await queryRunner.query(`DROP TABLE \`wallet\``);
    await queryRunner.query(`DROP TABLE \`transaction\``);
    await queryRunner.query(
      `DROP INDEX \`REL_20dc669aa93dfa9bc829d8530f\` ON \`auction\``,
    );
    await queryRunner.query(`DROP TABLE \`auction\``);
    await queryRunner.query(`DROP TABLE \`auction_participant\``);
    await queryRunner.query(`DROP TABLE \`bid\``);
  }
}
