import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { HttpError } from "../errors/http-error.js";
import {
  getPermissionsForRole,
  type Role,
} from "../permissions/permissions.js";
import "./auth-context.js";

interface TokenPayload {
  sub: string;
  userId?: string;
  role: Role;
  userType: "internal" | "postulant";
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(
      header.slice("Bearer ".length),
      env.jwtSecret,
    ) as TokenPayload;
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

export const requireAuth: RequestHandler = (req, _res, next) => {
  optionalAuth(req, _res, (error) => {
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
