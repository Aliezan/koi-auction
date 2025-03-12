/* eslint-disable class-methods-use-this */
import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
import { hash } from "bcrypt";
import { faker } from "@faker-js/faker";
import User, { UserRole } from "../entities/User";
import Auction, { AuctionStatus } from "../entities/Auction";
import Wallet from "../entities/Wallet";

export default class MainSeeder implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager) {
    const userRepository = dataSource.getRepository(User);
    const auctionRepository = dataSource.getRepository(Auction);
    const walletRepository = dataSource.getRepository(Wallet);

    const existingUserCount = await userRepository.count();
    if (existingUserCount > 0) {
      console.log("Database already seeded. Skipping...");
      return;
    }

    const userFactory = factoryManager.get(User);
    const auctionFactory = factoryManager.get(Auction);
    const walletFactory = factoryManager.get(Wallet);

    const users = await Promise.all(
      Array.from({ length: 5 }, async (_, index) =>
        userFactory.make({
          username: `user-${index}`,
          email: `user-${index}@mail.com`,
          password: await hash(`Regularuser-${index}`, 12),
          phone: `+62${faker.string.numeric(10)}`,
        }),
      ),
    );

    const admins = await Promise.all(
      Array.from({ length: 2 }, async (_, index) =>
        userFactory.make({
          username: `admin-${index}`,
          email: `admin-${index}@mail.com`,
          phone: `+62${faker.string.numeric(10)}`,
          role: UserRole.ADMIN,
          password: await hash(`Adminuser-${index}`, 12),
        }),
      ),
    );

    // create Wallet for each user
    const wallets = await Promise.all(
      users.map((user) =>
        walletFactory.make({
          user,
          balance: parseFloat((Math.random() * 1000).toFixed(2)),
        }),
      ),
    );

    await userRepository.save([...users, ...admins]);
    await walletRepository.save(wallets);

    const auctions = await Promise.all(
      Array.from({ length: 2 }, () =>
        auctionFactory.make({
          user: admins[Math.floor(Math.random() * admins.length)],
          item: faker.number.int({ min: 1, max: 1000 }).toString(),
          buynow_price: parseFloat((Math.random() * 1000).toFixed(2)),
          status: AuctionStatus.PUBLISHED,
        }),
      ),
    );

    await auctionRepository.save(auctions);
  }
}
