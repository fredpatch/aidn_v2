import express, { Application } from "express";
import { errorHandler } from "./shared/errors/error-handler.js";
import { apiRouter } from "./router/routes.js";
import { middlewares } from "./middlewares/init.js";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  // production origins here
];

export const createApp = () => {
  const app: Application = express();

  // Initialize middlewares with CORS configuration
  middlewares(app, {
    disablePoweredBy: true,
    cors: {
      allowlist: ALLOWED_ORIGINS,
      allowNoOrigin: true, // ✅ Allow non-browser clients (e.g., Postman, mobile apps)
      credentials: true, // ✅ Allow cookies/auth headers
    },
  });

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
