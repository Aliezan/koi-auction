import { DataSource } from "typeorm";
import { config } from "dotenv";

config();

const { DB_NAME, DB_PORT, DB_HOST, DB_USERNAME, DB_PASS } = process.env;
const AppDataSource = new DataSource({
  type: "mysql",
  host: DB_HOST,
  port: parseInt(DB_PORT ?? "3306"),
  timezone: "Z",
  username: DB_USERNAME,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: false, // Make sure this is false
  logging: false,
  entities: ["src/entities/*.ts"],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "migrations",
});

const initDb = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

export { initDb };
