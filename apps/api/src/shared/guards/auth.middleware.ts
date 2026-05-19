import type { Request, RequestHandler, Response, NextFunction } from "express";

import { HttpError } from "../errors/http-error.js";
import {
  getAuthCookieName,
  type AuthCookieScope,
} from "../../modules/auth/auth.cookies.js";
import { verifySessionToken } from "../../modules/auth/auth.tokens.js";
import {
  getPermissionsForRole,
  type Role,
} from "../permissions/permissions.js";
import "./auth-context.js";

type AuthMiddlewareOptions = {
  scope?: AuthCookieScope;
};

interface TokenPayload {
  sub: string;
  userId?: string;
  role: Role;
  userType: "internal" | "postulant";
}

const tokenFromCookies = (
  req: Request,
  options: AuthMiddlewareOptions,
) => {
  if (!options.scope) {
    throw new HttpError(500, "Authentication cookie scope is required");
  }

  const cookies = req.cookies as Record<string, string | undefined> | undefined;

  if (!cookies) {
    return undefined;
  }

  return cookies[getAuthCookieName(options.scope)];
};

const createOptionalAuth =
  (options: AuthMiddlewareOptions = {}): RequestHandler =>
  (req, _res, next) => {
    let token: string | undefined;

    try {
      token = tokenFromCookies(req, options);
    } catch (error) {
      next(error);
      return;
    }

    if (!token) {
      next();
      return;
    }

  try {
    const payload = verifySessionToken(token) as TokenPayload;
    const userId = payload.userId ?? payload.sub;

    if (!userId) {
      next(new HttpError(401, "Invalid authentication token"));
      return;
    }

    req.user = {
      id: userId,
      role: payload.role,
      userType: payload.userType,
      permissions: getPermissionsForRole(payload.role),
    };
    next();
  } catch {
    next(new HttpError(401, "Invalid authentication token"));
  }
};

export const optionalAuth = createOptionalAuth();

const createRequireAuth =
  (options: AuthMiddlewareOptions = {}): RequestHandler =>
  (req, res, next) => {
    createOptionalAuth(options)(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    if (!req.user) {
      next(new HttpError(401, "Authentication required"));
      return;
    }

    next();
  });
};

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void;
export function requireAuth(options?: AuthMiddlewareOptions): RequestHandler;
export function requireAuth(
  first?: Request | AuthMiddlewareOptions,
  res?: Response,
  next?: NextFunction,
): void | RequestHandler {
  if (typeof first === "function" || (first && "headers" in first)) {
    createRequireAuth()(first as Request, res as Response, next as NextFunction);
    return;
  }

  return createRequireAuth(first as AuthMiddlewareOptions | undefined);
}
