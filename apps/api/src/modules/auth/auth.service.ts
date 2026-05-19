import bcrypt from "bcryptjs";

import { HttpError } from "../../shared/errors/http-error.js";
import { getPermissionsForRole, Roles, type Role } from "../../shared/permissions/permissions.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { AidnInternalAccountModel } from "../users/aidn-internal-account.model.js";
import { UserModel } from "../users/user.model.js";
import { personnelAdapter } from "../personnel/personnel.service.js";
import { signSessionToken } from "./auth.tokens.js";

const toCurrentUserPayload = (user: {
  _id: { toString(): string };
  userType: "internal" | "postulant";
  fullName: string;
  email?: string | null;
  phone?: string | null;
  matricule?: string | null;
  role: Role;
  organizationId?: { toString(): string } | string | null;
}) => ({
  id: user._id.toString(),
  userType: user.userType,
  fullName: user.fullName,
  email: user.email ?? undefined,
  phone: user.phone ?? undefined,
  matricule: user.matricule ?? undefined,
  role: user.role,
  organizationId: user.organizationId?.toString(),
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

export const getCurrentPortalUser = async (userId: string) => {
  const user = await UserModel.findById(userId).lean();

  if (!user) {
    throw new HttpError(404, "Current user not found");
  }

  if (
    user.userType !== "postulant" ||
    user.role !== Roles.POSTULANT ||
    !user.isActive
  ) {
    throw new HttpError(403, "Portal access denied");
  }

  return toCurrentUserPayload(user);
};

export const loginPortalUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const auditBase = {
    actorRole: "anonymous",
    entityType: "auth",
    metadata: { email: normalizedEmail }
  };

  if (!normalizedEmail || !password) {
    await writeAuditLog({
      ...auditBase,
      action: "auth.portal_login_failed",
      metadata: { email: normalizedEmail, reason: "missing_credentials" }
    });
    throw new HttpError(400, "Email and password are required");
  }

  const user = await UserModel.findOne({
    email: normalizedEmail,
    userType: "postulant",
    role: Roles.POSTULANT
  });

  if (!user?.passwordHash) {
    await writeAuditLog({
      ...auditBase,
      action: "auth.portal_login_failed",
      metadata: { email: normalizedEmail, reason: "invalid_credentials" }
    });
    throw new HttpError(401, "Invalid portal credentials");
  }

  if (!user.isActive) {
    await writeAuditLog({
      actorId: user._id,
      actorRole: user.role,
      action: "auth.portal_login_failed",
      entityType: "user",
      entityId: user._id,
      metadata: { email: normalizedEmail, reason: "inactive_user" }
    });
    throw new HttpError(403, "Portal access denied");
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    await writeAuditLog({
      actorId: user._id,
      actorRole: user.role,
      action: "auth.portal_login_failed",
      entityType: "user",
      entityId: user._id,
      metadata: { email: normalizedEmail, reason: "invalid_credentials" }
    });
    throw new HttpError(401, "Invalid portal credentials");
  }

  user.lastLoginAt = new Date();
  await user.save();

  await writeAuditLog({
    actorId: user._id,
    actorRole: user.role,
    action: "auth.portal_login_success",
    entityType: "user",
    entityId: user._id,
    metadata: { email: normalizedEmail }
  });

  return {
    token: signSessionToken({ id: user._id.toString(), role: user.role, userType: "postulant" }),
    user: toCurrentUserPayload(user)
  };
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

  const personnel = await personnelAdapter.getPersonnelByMatricule(normalizedMatricule);

  if (!personnel) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", metadata: { matricule: normalizedMatricule, reason: "personnel_missing" } });
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

  if (account.status === "disabled") {
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
      fonction: personnel.fonction,
      matricule: personnel.matricule,
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

  if (!user.passwordHash) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", actorId: user._id, actorRole: user.role, entityId: user._id, metadata: { matricule: normalizedMatricule, personnelId: personnel.personnelId, reason: "local_password_missing" } });
    throw new HttpError(401, "Invalid AIDN credentials");
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_login_failed", actorId: user._id, actorRole: user.role, entityId: user._id, metadata: { matricule: normalizedMatricule, personnelId: personnel.personnelId, reason: "invalid_local_password" } });
    throw new HttpError(401, "Invalid AIDN credentials");
  }

  user.lastLoginAt = new Date();
  await user.save();

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
    requiresPasswordChange: user.mustChangePassword === true,
    user: toCurrentUserPayload(user)
  };
};

export const changeInternalPassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await UserModel.findById(userId);
  const auditBase = {
    actorId: user?._id,
    actorRole: user?.role ?? "anonymous",
    entityType: "user",
    entityId: user?._id,
  };

  if (!user) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_password_change_failed", metadata: { reason: "user_missing" } });
    throw new HttpError(404, "Current user not found");
  }

  if (user.userType !== "internal") {
    await writeAuditLog({ ...auditBase, action: "auth.internal_password_change_failed", metadata: { reason: "not_internal_user" } });
    throw new HttpError(403, "Only internal users can change internal passwords");
  }

  if (!currentPassword || !newPassword) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_password_change_failed", metadata: { reason: "missing_password" } });
    throw new HttpError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_password_change_failed", metadata: { reason: "new_password_too_short" } });
    throw new HttpError(400, "New password must be at least 8 characters");
  }

  if (!user.passwordHash) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_password_change_failed", metadata: { reason: "local_password_missing" } });
    throw new HttpError(401, "Invalid current password");
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_password_change_failed", metadata: { reason: "invalid_current_password" } });
    throw new HttpError(401, "Invalid current password");
  }

  const account = await AidnInternalAccountModel.findOne({ userId: user._id });

  if (!account) {
    await writeAuditLog({ ...auditBase, action: "auth.internal_password_change_failed", metadata: { reason: "internal_account_missing" } });
    throw new HttpError(404, "AIDN internal account not found");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  user.temporaryPasswordExpiresAt = undefined;
  user.passwordChangedAt = new Date();
  await user.save();

  if (account.status === "pending_first_login") {
    account.status = "active";
    await account.save();
  }

  await writeAuditLog({
    actorId: user._id,
    actorRole: user.role,
    action: "auth.internal_password_change_success",
    entityType: "user",
    entityId: user._id,
    metadata: { accountId: account._id.toString(), matricule: user.matricule },
  });

  return {
    user: toCurrentUserPayload(user),
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
