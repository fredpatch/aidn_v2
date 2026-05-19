import type { CookieOptions, Response } from "express";
import { randomBytes } from "node:crypto";

import { env } from "../../shared/config/env.js";

export type CsrfScope = "admin" | "portal";

export const generateCsrfToken = (): string =>
  randomBytes(32).toString("base64url");

export const getCsrfCookieName = (scope: CsrfScope): string =>
  scope === "admin" ? env.authCsrfCookieName : env.portalCsrfCookieName;

export const getCsrfHeaderName = (): string => env.csrfHeaderName;

const getCsrfCookieOptions = (): CookieOptions => ({
  httpOnly: false,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  domain: env.cookieDomain || undefined,
  path: "/",
});

export const setCsrfCookie = (
  res: Response,
  token: string,
  scope: CsrfScope,
): void => {
  res.cookie(getCsrfCookieName(scope), token, getCsrfCookieOptions());
};

export const clearCsrfCookie = (
  res: Response,
  scope: CsrfScope,
): void => {
  res.clearCookie(getCsrfCookieName(scope), getCsrfCookieOptions());
};
