import express from "express";
import axios from "axios";

const router = express.Router();
const coinIds = "bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,polkadot,avalanche-2,chainlink,tron,toncoin,shiba-inu,litecoin";

router.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: req.query.currency || "inr",
        ids: coinIds,
        order: "market_cap_desc",
        per_page: 14,
        page: 1,
        sparkline: false,
        price_change_percentage: "24h",
      },
      timeout: 10000,
    });

    res.json({
      currency: req.query.currency || "inr",
      updatedAt: new Date().toISOString(),
      coins: response.data.map((coin) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        price: coin.current_price,
        marketCap: coin.market_cap,
        rank: coin.market_cap_rank,
        change24h: coin.price_change_percentage_24h,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
      })),
    });
  } catch (error) {
    res.status(502).json({ error: "Live crypto data is temporarily unavailable." });
  }
});

router.get("/simple", async (_req, res) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=inr",
      { timeout: 10000 }
    );
    res.json(response.data);
  } catch (error) {
    res.status(502).json({ error: "Crypto API failed." });
  }
});

export default router;
