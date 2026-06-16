import rateLimit from "express-rate-limit";

import { env } from "../../shared/config/env.js";

export const publicAccountRequestRateLimit = rateLimit({
  windowMs: env.publicAccountRequestRateLimitWindowMs,
  limit: env.publicAccountRequestRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: "Trop de demandes envoyees. Veuillez reessayer plus tard.",
      },
    });
  },
});
