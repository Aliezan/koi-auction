import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1741786689827 implements MigrationInterface {
  name = "Migration1741786689827";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`auction\` CHANGE \`reserve_price\` \`buynow_price\` decimal NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE \`news\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`mainImage\` varchar(255) NOT NULL, \`paragraph\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`authorUserId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction\` CHANGE \`buynow_price\` \`buynow_price\` decimal(10,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`news\` ADD CONSTRAINT \`FK_e69560c1b2746accbac863c5aa5\` FOREIGN KEY (\`authorUserId\`) REFERENCES \`user\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`news\` DROP FOREIGN KEY \`FK_e69560c1b2746accbac863c5aa5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auction\` CHANGE \`buynow_price\` \`buynow_price\` decimal NULL`,
    );
    await queryRunner.query(`DROP TABLE \`news\``);
    await queryRunner.query(
      `ALTER TABLE \`auction\` CHANGE \`buynow_price\` \`reserve_price\` decimal NULL`,
    );
  }
}
