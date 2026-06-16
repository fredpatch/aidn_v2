import type { ErrorRequestHandler } from "express";

import { HttpError } from "./http-error.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    error: {
      message: "Internal server error"
    }
  });
};
