import { setSeederFactory } from "typeorm-extension";
import Auction from "../../entities/Auction";

const auctionsFactory = setSeederFactory(Auction, () => {
  const auction = new Auction() as Pick<Auction, "item" | "user">;

  return auction;
});

export default auctionsFactory;
