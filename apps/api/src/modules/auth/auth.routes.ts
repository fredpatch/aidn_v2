import { Router } from "express";

import { requireAuth } from "../../shared/guards/auth.middleware.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { clearAuthCookie, setAuthCookie } from "./auth.cookies.js";
import {
  clearCsrfCookie,
  generateCsrfToken,
  setCsrfCookie,
} from "./auth.csrf.js";
import {
  getCurrentUser,
  changeInternalPassword,
  loginBootstrapAdmin,
  loginInternalUser,
} from "./auth.service.js";

export const authRouter = Router();

authRouter.get(
  "/me",
  requireAuth({ scope: "admin" }),
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
    const result = await loginInternalUser(matricule ?? "", password ?? "");
    setAuthCookie(res, result.token, "admin");
    setCsrfCookie(res, generateCsrfToken(), "admin");
    res.json({
      requiresPasswordChange: result.requiresPasswordChange,
      user: result.user,
    });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearAuthCookie(res, "admin");
    clearCsrfCookie(res, "admin");
    res.json({ ok: true });
  }),
);

authRouter.post(
  "/internal/change-password",
  requireAuth({ scope: "admin" }),
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
    const result = await loginBootstrapAdmin(email ?? "", password ?? "");
    setAuthCookie(res, result.token, "admin");
    setCsrfCookie(res, generateCsrfToken(), "admin");
    res.json({
      user: result.user,
    });
  }),
);
