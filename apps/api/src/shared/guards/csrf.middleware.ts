import type { RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";

import {
  getCsrfCookieName,
  getCsrfHeaderName,
  type CsrfScope,
} from "../../modules/auth/auth.csrf.js";
import { env } from "../config/env.js";
import { HttpError } from "../errors/http-error.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

const publicUnsafeRoutes = new Set([
  "/auth/bootstrap/login",
  "/auth/internal/login",
  "/auth/logout",
  "/portal/auth/login",
  "/portal/auth/logout",
  "/portal/account-requests",
]);

const stripApiPrefix = (path: string): string => {
  if (path === env.apiPrefix) {
    return "/";
  }

  return path.startsWith(`${env.apiPrefix}/`)
    ? path.slice(env.apiPrefix.length)
    : path;
};

const getScopeFromPath = (path: string): CsrfScope | undefined => {
  if (path.startsWith("/admin/") || path.startsWith("/auth/")) {
    return "admin";
  }

  if (path.startsWith("/portal/")) {
    return "portal";
  }

  return undefined;
};

const tokensMatch = (cookieToken: string, headerToken: string): boolean => {
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  return (
    cookieBuffer.length === headerBuffer.length &&
    timingSafeEqual(cookieBuffer, headerBuffer)
  );
};

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (safeMethods.has(req.method)) {
    next();
    return;
  }

  const routePath = stripApiPrefix(req.path);

  if (publicUnsafeRoutes.has(routePath)) {
    next();
    return;
  }

  const scope = getScopeFromPath(routePath);

  if (!scope) {
    next();
    return;
  }

  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const cookieToken = cookies?.[getCsrfCookieName(scope)];
  const headerToken = req.header(getCsrfHeaderName());

  if (!cookieToken || !headerToken || !tokensMatch(cookieToken, headerToken)) {
    next(new HttpError(403, "CSRF token invalide ou manquant."));
    return;
  }

  next();
};
