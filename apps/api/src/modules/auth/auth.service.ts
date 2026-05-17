import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { env } from "../../shared/config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getPermissionsForRole, Roles, type Role } from "../../shared/permissions/permissions.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { AidnInternalAccountModel } from "../users/aidn-internal-account.model.js";
import { UserModel } from "../users/user.model.js";
import { personnelAdapter } from "../personnel/personnel.service.js";

export const signSessionToken = (user: { id: string; role: Role; userType: "internal" | "postulant" }): string =>
  jwt.sign({ userId: user.id, role: user.role, userType: user.userType }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn
  });

const toCurrentUserPayload = (user: {
  _id: { toString(): string };
  userType: "internal" | "postulant";
  fullName: string;
  email?: string | null;
  matricule?: string | null;
  role: Role;
}) => ({
  id: user._id.toString(),
  userType: user.userType,
  fullName: user.fullName,
  email: user.email ?? undefined,
  matricule: user.matricule ?? undefined,
  role: user.role,
  permissions: getPermissionsForRole(user.role)
});

export const getCurrentUser = async (userId: string) => {
  const user = await UserModel.findById(userId).lean();

  if (!user) {
    throw new HttpError(404, "Current user not found");
  }

  if (!user.isActive) {
    throw new HttpError(403, "User account is inactive");
  }

  return toCurrentUserPayload(user);
};

export const loginInternalUser = async (matricule: string, password: string) => {
  const normalizedMatricule = matricule.trim().toUpperCase();
  const auditBase = {
    actorRole: "anonymous",
    entityType: "auth",
    metadata: { matricule: normalizedMatricule }
  };

  if (!normalizedMatricule || !password) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", metadata: { matricule: normalizedMatricule, reason: "missing_credentials" } });
    throw new HttpError(400, "Matricule and password are required");
  }

  const personnel = await personnelAdapter.authenticateByMatricule(normalizedMatricule, password);

  if (!personnel) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", metadata: { matricule: normalizedMatricule, reason: "invalid_credentials" } });
    throw new HttpError(401, "Invalid personnel credentials");
  }

  const account = await AidnInternalAccountModel.findOne({
    personnelSource: "official_personnel_db",
    personnelId: personnel.personnelId
  });

  if (!account) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", metadata: { matricule: normalizedMatricule, personnelId: personnel.personnelId, reason: "not_activated" } });
    throw new HttpError(403, "AIDN internal account is not activated");
  }

  if (account.status !== "active") {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", entityId: account._id, metadata: { matricule: normalizedMatricule, personnelId: personnel.personnelId, reason: "account_disabled" } });
    throw new HttpError(403, "AIDN internal account is disabled");
  }

  const user = await UserModel.findByIdAndUpdate(
    account.userId,
    {
      fullName: personnel.fullName,
      email: personnel.email,
      phone: personnel.phone,
      service: personnel.service,
      direction: personnel.direction,
      matricule: personnel.matricule,
      lastLoginAt: new Date(),
      lastSyncedAt: new Date()
    },
    { new: true }
  );

  if (!user) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", entityId: account._id, metadata: { matricule: normalizedMatricule, personnelId: personnel.personnelId, reason: "linked_user_missing" } });
    throw new HttpError(404, "Linked AIDN user not found");
  }

  if (!user.isActive) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", actorId: user._id, actorRole: user.role, entityId: user._id, metadata: { matricule: normalizedMatricule, personnelId: personnel.personnelId, reason: "local_user_inactive" } });
    throw new HttpError(403, "User account is inactive");
  }

  account.lastLoginAt = new Date();
  await account.save();

  await writeAuditLog({
    actorId: user._id,
    actorRole: user.role,
    action: "auth.internal_login_success",
    entityType: "user",
    entityId: user._id,
    metadata: { matricule: normalizedMatricule, personnelId: personnel.personnelId }
  });

  return {
    token: signSessionToken({ id: user._id.toString(), role: user.role, userType: "internal" }),
    user: toCurrentUserPayload(user)
  };
};

export const loginBootstrapAdmin = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    await writeAuditLog({
      actorRole: "anonymous",
      action: "auth.bootstrap_login_failed",
      entityType: "auth",
      metadata: { email: normalizedEmail, reason: "missing_credentials" }
    });
    throw new HttpError(400, "Email and password are required");
  }

  const user = await UserModel.findOne({
    email: normalizedEmail,
    role: Roles.BOOTSTRAP_ADMIN
  });

  if (!user?.passwordHash) {
    await writeAuditLog({
      actorRole: "anonymous",
      action: "auth.bootstrap_login_failed",
      entityType: "auth",
      metadata: { email: normalizedEmail, reason: "invalid_credentials" }
    });
    throw new HttpError(401, "Invalid bootstrap credentials");
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    await writeAuditLog({
      actorId: user._id,
      actorRole: user.role,
      action: "auth.bootstrap_login_failed",
      entityType: "user",
      entityId: user._id,
      metadata: { email: normalizedEmail, reason: "invalid_credentials" }
    });
    throw new HttpError(401, "Invalid bootstrap credentials");
  }

  if (!user.isActive) {
    await writeAuditLog({
      actorId: user._id,
      actorRole: user.role,
      action: "auth.bootstrap_login_failed",
      entityType: "user",
      entityId: user._id,
      metadata: { email: normalizedEmail, reason: "inactive_user" }
    });
    throw new HttpError(403, "User account is inactive");
  }

  user.lastLoginAt = new Date();
  await user.save();

  await writeAuditLog({
    actorId: user._id,
    actorRole: user.role,
    action: "auth.bootstrap_login_success",
    entityType: "user",
    entityId: user._id,
    metadata: { email: normalizedEmail }
  });

  return {
    token: signSessionToken({ id: user._id.toString(), role: user.role, userType: "internal" }),
    user: toCurrentUserPayload(user)
  };
};

export const bootstrapIdentity = {
  role: Roles.BOOTSTRAP_ADMIN,
  permissions: getPermissionsForRole(Roles.BOOTSTRAP_ADMIN)
};
