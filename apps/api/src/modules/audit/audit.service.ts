import type { Types } from "mongoose";

import { UserModel } from "../users/user.model.js";
import { AuditLogModel } from "./audit-log.model.js";

export const writeAuditLog = async (input: {
  actorId?: string | Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | Types.ObjectId;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  await AuditLogModel.create({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before,
    after: input.after,
    metadata: input.metadata
  });
};

export const listAuditLogs = async (filters: { action?: string; actorId?: string; limit?: number; page?: number }) => {
  const query: Record<string, unknown> = {};
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const skip = (page - 1) * limit;

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.actorId) {
    query.actorId = filters.actorId;
  }

  const [logs, total] = await Promise.all([
    AuditLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLogModel.countDocuments(query),
  ]);

  const actorIds = logs
    .map((log) => log.actorId?.toString())
    .filter((actorId): actorId is string => Boolean(actorId));
  const actors = await UserModel.find({ _id: { $in: actorIds } })
    .select("fullName matricule email role userType")
    .lean();
  const actorById = new Map(actors.map((actor) => [actor._id.toString(), actor]));

  return {
    items: logs.map((log) => {
      const actorId = log.actorId?.toString();
      const actor = actorId ? actorById.get(actorId) : undefined;

      return {
        ...log,
        actorId,
        actor: actor
          ? {
              id: actor._id.toString(),
              fullName: actor.fullName,
              matricule: actor.matricule,
              email: actor.email,
              role: actor.role,
              userType: actor.userType,
            }
          : undefined,
      };
    }),
    total,
    page,
    limit,
  };
};
