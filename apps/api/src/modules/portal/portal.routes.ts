import { Router } from "express";

import { submitAccountRequest } from "../account-requests/account-request.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";

export const portalRouter = Router();

portalRouter.post(
  "/account-requests",
  asyncHandler(async (req, res) => {
    const result = await submitAccountRequest(req.body);
    res.status(201).json(result);
  }),
);

