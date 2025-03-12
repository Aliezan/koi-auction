import { Router } from "express";
import {
  blastNotification,
  // createNotification,
  getNotifications,
  getUserNotifications,
  markAllNotificationAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controllers";
import { authorize, protect } from "../middlewares/auth.middleware";
// import createNotificationValidator from "../middlewares/notificationValidator/createNotificationValidator";
import { parsePaginationAndFilters } from "../middlewares/parsePaginationFilter.middleware";

const notificationRouter = Router();

notificationRouter.get(
  "/",
  protect(),
  authorize(["admin"]),
  parsePaginationAndFilters,
  getNotifications,
);
// notificationRouter.post(
//   "/",
//   protect(),
//   authorize(["admin"]),
//   createNotificationValidator,
//   createNotification,
// );
notificationRouter.get(
  "/me",
  protect(),
  authorize(["user", "admin"]),
  parsePaginationAndFilters,
  getUserNotifications,
);

notificationRouter.post(
  "/blast",
  protect(),
  authorize(["admin"]),
  blastNotification,
);

notificationRouter.post(
  "/read/all",
  protect(),
  authorize(["user", "admin"]),
  markAllNotificationAsRead,
);

notificationRouter.post(
  "/read/:notification_id",
  protect(),
  authorize(["user", "admin"]),
  markNotificationAsRead,
);

export default notificationRouter;
