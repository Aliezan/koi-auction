import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware";
import { AppDataSource } from "../config/data-source";
import { Job } from "../entities/Job";

const jobRouter = Router();
const jobRepository = AppDataSource.getRepository(Job);
jobRouter.get("/", protect(), authorize(["admin"]), async (req, res) => {
  const jobs = await jobRepository.findAndCount();
  res.json({ data: jobs });
});

export default jobRouter;
