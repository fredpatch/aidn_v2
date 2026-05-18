import { Router } from "express";

import { requireAuth } from "../../shared/guards/auth.middleware.js";
import { requirePermission } from "../../shared/guards/permission.middleware.js";
import {
  Permissions,
  type Role,
} from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { listAuditLogs } from "../audit/audit.service.js";
import {
  activateInternalAccount,
  listAccountRequests,
  listInternalAccounts,
  listOrganizations,
  listSiUsers,
  searchPersonnel,
} from "./admin.service.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);

/* Test connection to SI_ANAC Database */
adminRouter.get(
  "/si-users",
  requirePermission(Permissions.PERSONNEL_SEARCH),
  asyncHandler(async (req, res) => {
    const { q, limit, page, direction, fonction } = req.query;

    const result = await listSiUsers({
      q: q ? String(q) : undefined,
      limit: limit ? Number(limit) : 10,
      page: page ? Number(page) : 1,
      direction: direction ? String(direction) : undefined,
      fonction: fonction ? String(fonction) : undefined,
    });

    res.json(result);
  }),
);

adminRouter.get(
  "/personnel",
  requirePermission(Permissions.PERSONNEL_SEARCH),
  asyncHandler(async (req, res) => {
    res.json({ items: await searchPersonnel(String(req.query.search ?? "")) });
  }),
);

adminRouter.get(
  "/internal-accounts",
  requirePermission(Permissions.AIDN_USER_ACTIVATE),
  asyncHandler(async (req, res) => {
    res.json({
      items: await listInternalAccounts({
        search:
          typeof req.query.search === "string" ? req.query.search : undefined,
        role: typeof req.query.role === "string" ? req.query.role : undefined,
        status:
          typeof req.query.status === "string" ? req.query.status : undefined,
      }),
    });
  }),
);

adminRouter.post(
  "/internal-accounts/activate",
  requirePermission(Permissions.AIDN_USER_ACTIVATE),
  asyncHandler(async (req, res) => {
    const body = req.body as { personnelId?: string; role?: Role };
    const result = await activateInternalAccount({
      personnelId: body.personnelId ?? "",
      role: body.role as Role,
      activatedById: req.user!.id,
      activatedByRole: req.user!.role,
    });

    res.status(201).json(result);
  }),
);

adminRouter.get(
  "/organizations",
  requirePermission(Permissions.ORGANIZATION_MANAGE),
  asyncHandler(async (_req, res) => {
    res.json({ items: await listOrganizations() });
  }),
);

adminRouter.get(
  "/account-requests",
  requirePermission(Permissions.POSTULANT_ACCOUNT_REVIEW),
  asyncHandler(async (_req, res) => {
    res.json({ items: await listAccountRequests() });
  }),
);

adminRouter.get(
  "/audit-logs",
  requirePermission(Permissions.AUDIT_VIEW),
  asyncHandler(async (req, res) => {
    const limit =
      typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

    res.json({
      items: await listAuditLogs({
        action:
          typeof req.query.action === "string" ? req.query.action : undefined,
        actorId:
          typeof req.query.actorId === "string" ? req.query.actorId : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
      }),
    });
  }),
);
