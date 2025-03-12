import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware";
import { parsePaginationAndFilters } from "../middlewares/parsePaginationFilter.middleware";
import {
  addToWishlist,
  getUserWishlists,
  removeFromWishlist,
} from "../controllers/wishlist.controllers";
import addToWishlistValidator from "../middlewares/wishlistValidator/addToWishlist.validator";

const wishlistRouter = Router();
wishlistRouter.get(
  "/",
  protect(),
  authorize(["user", "admin"]),
  parsePaginationAndFilters,
  getUserWishlists,
);

wishlistRouter.post(
  "/:auction_id",
  protect(),
  authorize(["user", "admin"]),
  addToWishlistValidator,
  addToWishlist,
);

wishlistRouter.delete(
  "/:auction_id",
  protect(),
  authorize(["user", "admin"]),
  removeFromWishlist,
);

export default wishlistRouter;
