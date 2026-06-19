import { Router, type RequestHandler } from "express";

import { HttpError } from "../../shared/errors/http-error.js";
import { Permissions } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import {
  downloadDgCircuitTaskDocumentController,
  listDgCircuitTasksController,
} from "./dg-circuit.controller.js";

const requireAnyPermission =
  (
    permissions: Array<(typeof Permissions)[keyof typeof Permissions]>,
  ): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new HttpError(401, "Authentication required"));
      return;
    }

    if (
      !permissions.some((permission) =>
        req.user!.permissions.includes(permission),
      )
    ) {
      next(new HttpError(403, "Missing required permission"));
      return;
    }

    next();
  };

const requireDgCircuitTaskAccess = requireAnyPermission([
  Permissions.DG_CIRCUIT_HANDLE,
  Permissions.COURRIER_REGISTER_PHYSICAL,
  Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE,
  Permissions.DG_DECISION_RECORD,
]);

export const dgCircuitRouter = Router();

dgCircuitRouter.get(
  "/tasks",
  requireDgCircuitTaskAccess,
  asyncHandler(listDgCircuitTasksController),
);

dgCircuitRouter.get(
  "/tasks/:taskId/documents/:documentId",
  requireDgCircuitTaskAccess,
  asyncHandler(downloadDgCircuitTaskDocumentController),
);
