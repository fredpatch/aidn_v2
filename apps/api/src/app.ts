import express, { Application } from "express";
import { errorHandler } from "./shared/errors/error-handler.js";
import { apiRouter } from "./router/routes.js";
import { middlewares } from "./middlewares/init.js";
import { env } from "./shared/config/env.js";
import { csrfProtection } from "./shared/guards/csrf.middleware.js";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:8080",
  // production origins here
];

export const createApp = () => {
  const app: Application = express();

  // Initialize middlewares with CORS configuration
  middlewares(app, {
    disablePoweredBy: true,
    bodyLimit: "100kb",
    urlencodedLimit: "100kb",
    cors: {
      allowlist: env.corsOrigins.length ? env.corsOrigins : ALLOWED_ORIGINS,
      allowNoOrigin: true, // ✅ Allow non-browser clients (e.g., Postman, mobile apps)
      credentials: true, // ✅ Allow cookies/auth headers
    },
  });

  app.use(csrfProtection);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "aidn-api",
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use(apiRouter);

  // Global error handler (must be last middleware)
  app.use(errorHandler);

  return app;
};
