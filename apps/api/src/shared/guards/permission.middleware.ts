import type { RequestHandler } from "express";

import { HttpError } from "../errors/http-error.js";
import type { Permission } from "../permissions/permissions.js";

export const requirePermission =
  (permission: Permission): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new HttpError(401, "Authentication required"));
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      next(new HttpError(403, `Missing permission: ${permission}`));
      return;
    }

    next();
  };
