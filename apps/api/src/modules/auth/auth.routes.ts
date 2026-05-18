import { Router } from "express";

import { requireAuth } from "../../shared/guards/auth.middleware.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import {
  getCurrentUser,
  changeInternalPassword,
  loginBootstrapAdmin,
  loginInternalUser,
} from "./auth.service.js";

export const authRouter = Router();

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await getCurrentUser(req.user!.id));
  }),
);

authRouter.post(
  "/internal/login",
  asyncHandler(async (req, res) => {
    const { matricule, password } = req.body as {
      matricule?: string;
      password?: string;
    };
    res.json(await loginInternalUser(matricule ?? "", password ?? ""));
  }),
);

authRouter.post(
  "/internal/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    res.json(
      await changeInternalPassword(
        req.user!.id,
        currentPassword ?? "",
        newPassword ?? "",
      ),
    );
  }),
);

authRouter.post(
  "/bootstrap/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    res.json(await loginBootstrapAdmin(email ?? "", password ?? ""));
  }),
);
