import type { Types } from "mongoose";

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

export const listAuditLogs = async (filters: { action?: string; actorId?: string; limit?: number }) => {
  const query: Record<string, unknown> = {};

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.actorId) {
    query.actorId = filters.actorId;
  }

  return AuditLogModel.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(filters.limit ?? 50, 100))
    .lean();
};
