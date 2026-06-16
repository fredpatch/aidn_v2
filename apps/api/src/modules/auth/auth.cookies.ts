import type { CookieOptions, Response } from "express";

import { env } from "../../shared/config/env.js";

export type AuthCookieScope = "admin" | "portal";

const durationPattern = /^(\d+)(ms|s|m|h|d)?$/;

export const jwtMaxAgeMs = (value = env.jwtExpiresIn): number => {
  const match = durationPattern.exec(String(value).trim());

  if (!match) {
    return 30 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? "ms";

  switch (unit) {
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "m":
      return amount * 60 * 1000;
    case "s":
      return amount * 1000;
    default:
      return amount;
  }
};

export const getAuthCookieName = (scope: AuthCookieScope): string =>
  scope === "admin" ? env.authCookieName : env.portalAuthCookieName;

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  domain: env.cookieDomain || undefined,
  path: "/",
  maxAge: jwtMaxAgeMs(),
});

export const setAuthCookie = (
  res: Response,
  token: string,
  scope: AuthCookieScope,
): void => {
  res.cookie(getAuthCookieName(scope), token, getCookieOptions());
};

export const clearAuthCookie = (
  res: Response,
  scope: AuthCookieScope,
): void => {
  const { maxAge: _maxAge, ...options } = getCookieOptions();
  res.clearCookie(getAuthCookieName(scope), options);
};
