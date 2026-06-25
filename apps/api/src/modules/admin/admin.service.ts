import { HttpError } from "../../shared/errors/http-error.js";
import { Roles, type Role } from "../../shared/permissions/permissions.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Types, type HydratedDocument } from "mongoose";
import { writeAuditLog } from "../audit/audit.service.js";
import { personnelAdapter } from "../personnel/personnel.service.js";
import {
  AidnInternalAccountModel,
  type AidnInternalAccount,
} from "../users/aidn-internal-account.model.js";
import { UserModel, type User } from "../users/user.model.js";

const activatableInternalRoles: Role[] = [
  Roles.ADMIN,
  Roles.DN_SUPERVISOR,
  Roles.DN_AGENT,
  Roles.DG_SECRETARIAT,
  Roles.RECEPTION,
  Roles.BUREAU_COURRIER,
];

const normalizeMatricule = (matricule: string) =>
  matricule.trim().toUpperCase();

const generateTemporaryPassword = () =>
  crypto.randomInt(100000, 1000000).toString();

const getTemporaryPasswordExpiresAt = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000);

type InternalAccountDocument = HydratedDocument<AidnInternalAccount>;
type UserDocument = HydratedDocument<User>;

type ListParams = {
  q?: string;
  limit: number;
  page: number;
  direction?: string;
  fonction?: string;
};

export type EmployeeDirectoryItem = {
  matricule: string; // "0098"
  firstName: string;
  lastName: string;
  direction: string | null;
  fonction: string | null;
};

const toInternalAccountPayload = (
  account: InternalAccountDocument,
  user: UserDocument,
) => {
  return {
    id: account._id.toString(),
    personnelId: account.personnelId,
    matricule: account.matricule,
    userId: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: account.role,
    status: account.status,
    activatedAt: account.createdAt?.toISOString(),
    activatedById: account.activatedById?.toString(),
    disabledAt: account.disabledAt?.toISOString(),
    disabledById: account.disabledById?.toString(),
    lastLoginAt: account.lastLoginAt?.toISOString(),
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword === true,
    temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt?.toISOString(),
    passwordChangedAt: user.passwordChangedAt?.toISOString(),
  };
};

const findInternalAccountAndUser = async (accountId: string) => {
  const account = await AidnInternalAccountModel.findById(accountId);

  if (!account) {
    throw new HttpError(404, "AIDN internal account not found");
  }

  const user = await UserModel.findById(account.userId);

  if (!user) {
    throw new HttpError(404, "Linked AIDN user not found");
  }

  return { account, user };
};

const assertCanManageTargetAccount = (
  account: { userId: { toString(): string } },
  actorId: string,
) => {
  if (account.userId.toString() === actorId) {
    throw new HttpError(400, "You cannot perform this action on your own account");
  }
};

const applyTemporaryPassword = async (user: UserDocument) => {
  const temporaryPassword = generateTemporaryPassword();
  const temporaryPasswordExpiresAt = getTemporaryPasswordExpiresAt();

  user.passwordHash = await bcrypt.hash(temporaryPassword, 12);
  user.mustChangePassword = true;
  user.temporaryPasswordExpiresAt = temporaryPasswordExpiresAt;
  user.passwordChangedAt = undefined;

  return { temporaryPassword, temporaryPasswordExpiresAt };
};

export const searchPersonnel = async (params: {
  search: string;
  page: number;
  limit: number;
}) => {
  const result = await personnelAdapter.searchPersonnel(params);

  const personnelIds = result.items.map((item) => item.personnelId);
  const matricules = result.items.map((item) => normalizeMatricule(item.matricule));
  const accounts = await AidnInternalAccountModel.find({
    personnelSource: "official_personnel_db",
    $or: [
      { personnelId: { $in: personnelIds } },
      { matricule: { $in: matricules } },
    ],
  }).lean();
  const accountByPersonnelLookup = new Map<string, (typeof accounts)[number]>();

  accounts.forEach((account) => {
    accountByPersonnelLookup.set(account.personnelId, account);
    accountByPersonnelLookup.set(normalizeMatricule(account.matricule), account);
  });

  return {
    items: result.items.map((personnel) => {
      const account =
        accountByPersonnelLookup.get(personnel.personnelId) ??
        accountByPersonnelLookup.get(normalizeMatricule(personnel.matricule));

      return {
        personnelId: personnel.personnelId,
        matricule: personnel.matricule,
        fullName: personnel.fullName,
        email: personnel.email,
        phone: personnel.phone,
        service: personnel.service,
        fonction: personnel.fonction,
        direction: personnel.direction,
        isActive: personnel.isActive,
        alreadyActivated: Boolean(account),
        aidnUserId: account?.userId?.toString(),
        aidnRole: account?.role,
        activationStatus: account?.status,
      };
    }),
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
};

export const listInternalAccounts = async (filters: {
  search?: string;
  role?: string;
  status?: string;
}) => {
  const query: Record<string, unknown> = {};

  if (filters.role) {
    query.role = filters.role;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const accounts = await AidnInternalAccountModel.find(query)
    .populate(
      "userId",
      "fullName email role isActive service direction matricule",
    )
    .sort({ createdAt: -1 })
    .lean();

  const search = filters.search?.trim().toLowerCase();

  return accounts
    .filter((account) => {
      if (!search) {
        return true;
      }

      const user = account.userId as unknown as {
        fullName?: string;
        email?: string;
        matricule?: string;
      };

      return [
        account.personnelId,
        account.matricule,
        user.fullName,
        user.email,
        user.matricule,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));
    })
    .map((account) => {
      const user = account.userId as unknown as {
        _id?: { toString(): string };
        fullName?: string;
        email?: string;
        isActive?: boolean;
        mustChangePassword?: boolean;
        temporaryPasswordExpiresAt?: Date;
        passwordChangedAt?: Date;
      };

      return {
        id: account._id.toString(),
        personnelId: account.personnelId,
        matricule: account.matricule,
        userId: user._id?.toString() ?? account.userId.toString(),
        fullName: user.fullName ?? "",
        email: user.email,
        role: account.role,
        status: account.status,
        activatedAt: account.createdAt?.toISOString(),
        activatedById: account.activatedById?.toString(),
        disabledAt: account.disabledAt?.toISOString(),
        disabledById: account.disabledById?.toString(),
        lastLoginAt: account.lastLoginAt?.toISOString(),
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword === true,
        temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt?.toISOString(),
        passwordChangedAt: user.passwordChangedAt?.toISOString(),
      };
    });
};

export const activateInternalAccount = async (input: {
  matricule: string;
  role: Role;
  activatedById: string;
  activatedByRole: Role;
}) => {
  const role = input.role;

  if (!activatableInternalRoles.includes(role)) {
    throw new HttpError(400, "Invalid internal activation role");
  }

  if (!input.matricule?.trim()) {
    throw new HttpError(400, "matricule is required");
  }

  const requestedMatricule = normalizeMatricule(input.matricule);
  const personnel = await personnelAdapter.getPersonnelByMatricule(
    requestedMatricule,
  );

  if (!personnel) {
    throw new HttpError(404, "Personnel record not found");
  }

  if (personnel.isActive === false) {
    throw new HttpError(400, "Cannot activate inactive personnel");
  }

  const existingAccount = await AidnInternalAccountModel.findOne({
    personnelSource: "official_personnel_db",
    $or: [
      { personnelId: personnel.personnelId },
      { matricule: normalizeMatricule(personnel.matricule) },
    ],
  }).lean();
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const now = new Date();
  const temporaryPasswordExpiresAt = getTemporaryPasswordExpiresAt();

  const user = await UserModel.findOneAndUpdate(
    existingAccount
      ? { _id: existingAccount.userId }
      : {
          externalSource: "official_personnel_db",
          externalUserId: personnel.personnelId,
        },
    {
      userType: "internal",
      fullName: personnel.fullName,
      email: personnel.email,
      phone: personnel.phone,
      role,
      externalSource: "official_personnel_db",
      externalUserId: personnel.personnelId,
      matricule: normalizeMatricule(personnel.matricule),
      service: personnel.service,
      direction: personnel.direction,
      passwordHash,
      mustChangePassword: true,
      temporaryPasswordExpiresAt,
      isActive: true,
      lastSyncedAt: now,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const account = await AidnInternalAccountModel.findOneAndUpdate(
    existingAccount
      ? { _id: existingAccount._id }
      : {
          personnelSource: "official_personnel_db",
          personnelId: personnel.personnelId,
        },
    {
      personnelSource: "official_personnel_db",
      personnelId: personnel.personnelId,
      matricule: normalizeMatricule(personnel.matricule),
      userId: user._id,
      role,
      status: "pending_first_login",
      activatedById: input.activatedById,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const action = !existingAccount
    ? "admin.internal_account_activated"
    : existingAccount.status === "disabled"
      ? "admin.internal_account_reactivated"
      : existingAccount.role !== role
        ? "admin.internal_account_role_changed"
        : "admin.internal_account_activated";

  await writeAuditLog({
    actorId: input.activatedById,
    actorRole: input.activatedByRole,
    action,
    entityType: "aidn_internal_account",
    entityId: account._id,
    before: existingAccount
      ? {
          role: existingAccount.role,
          status: existingAccount.status,
          userId: existingAccount.userId?.toString(),
        }
      : undefined,
    after: {
      role: account.role,
      status: account.status,
      userId: account.userId.toString(),
    },
    metadata: {
      personnelId: personnel.personnelId,
      matricule: normalizeMatricule(personnel.matricule),
    },
  });

  return {
    account: {
      id: account._id.toString(),
      personnelId: account.personnelId,
      matricule: account.matricule,
      userId: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: account.role,
      status: account.status,
      activatedAt: account.createdAt?.toISOString(),
      activatedById: account.activatedById?.toString(),
      lastLoginAt: account.lastLoginAt?.toISOString(),
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword === true,
      temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt?.toISOString(),
      passwordChangedAt: user.passwordChangedAt?.toISOString(),
    },
    temporaryPassword,
    expiresAt: temporaryPasswordExpiresAt.toISOString(),
  };
};

export const resetInternalAccountPassword = async (input: {
  accountId: string;
  actorId: string;
  actorRole: Role;
}) => {
  const { account, user } = await findInternalAccountAndUser(input.accountId);
  assertCanManageTargetAccount(account, input.actorId);

  const before = {
    status: account.status,
    mustChangePassword: user.mustChangePassword === true,
    temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt?.toISOString(),
    passwordChangedAt: user.passwordChangedAt?.toISOString(),
  };

  const { temporaryPassword, temporaryPasswordExpiresAt } =
    await applyTemporaryPassword(user);
  user.isActive = true;
  await user.save();

  account.status = "pending_first_login";
  await account.save();

  await writeAuditLog({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "admin.internal_account_password_reset",
    entityType: "aidn_internal_account",
    entityId: account._id,
    before,
    after: {
      status: account.status,
      mustChangePassword: user.mustChangePassword === true,
      temporaryPasswordExpiresAt: temporaryPasswordExpiresAt.toISOString(),
    },
    metadata: {
      personnelId: account.personnelId,
      matricule: account.matricule,
    },
  });

  return {
    account: toInternalAccountPayload(account, user),
    temporaryPassword,
    expiresAt: temporaryPasswordExpiresAt.toISOString(),
  };
};

export const updateInternalAccountRole = async (input: {
  accountId: string;
  role: Role;
  actorId: string;
  actorRole: Role;
}) => {
  if (!activatableInternalRoles.includes(input.role)) {
    throw new HttpError(400, "Invalid internal activation role");
  }

  const { account, user } = await findInternalAccountAndUser(input.accountId);
  assertCanManageTargetAccount(account, input.actorId);

  const before = { role: account.role, userRole: user.role };

  account.role = input.role;
  user.role = input.role;
  await Promise.all([account.save(), user.save()]);

  await writeAuditLog({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "admin.internal_account_role_changed",
    entityType: "aidn_internal_account",
    entityId: account._id,
    before,
    after: { role: account.role, userRole: user.role },
    metadata: {
      personnelId: account.personnelId,
      matricule: account.matricule,
    },
  });

  return {
    account: toInternalAccountPayload(account, user),
  };
};

export const disableInternalAccount = async (input: {
  accountId: string;
  actorId: string;
  actorRole: Role;
}) => {
  const { account, user } = await findInternalAccountAndUser(input.accountId);
  assertCanManageTargetAccount(account, input.actorId);

  const before = {
    status: account.status,
    isActive: user.isActive,
  };

  account.status = "disabled";
  account.disabledById = new Types.ObjectId(input.actorId);
  account.disabledAt = new Date();
  user.isActive = false;
  await Promise.all([account.save(), user.save()]);

  await writeAuditLog({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "admin.internal_account_disabled",
    entityType: "aidn_internal_account",
    entityId: account._id,
    before,
    after: {
      status: account.status,
      isActive: user.isActive,
      disabledAt: account.disabledAt?.toISOString(),
    },
    metadata: {
      personnelId: account.personnelId,
      matricule: account.matricule,
    },
  });

  return {
    account: toInternalAccountPayload(account, user),
  };
};

export const reactivateInternalAccount = async (input: {
  accountId: string;
  actorId: string;
  actorRole: Role;
}) => {
  const { account, user } = await findInternalAccountAndUser(input.accountId);
  assertCanManageTargetAccount(account, input.actorId);

  const before = {
    status: account.status,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword === true,
  };

  const { temporaryPassword, temporaryPasswordExpiresAt } =
    await applyTemporaryPassword(user);
  user.isActive = true;
  account.status = "pending_first_login";
  account.disabledAt = undefined;
  account.disabledById = undefined;
  await Promise.all([account.save(), user.save()]);

  await writeAuditLog({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "admin.internal_account_reactivated",
    entityType: "aidn_internal_account",
    entityId: account._id,
    before,
    after: {
      status: account.status,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword === true,
      temporaryPasswordExpiresAt: temporaryPasswordExpiresAt.toISOString(),
    },
    metadata: {
      personnelId: account.personnelId,
      matricule: account.matricule,
    },
  });

  return {
    account: toInternalAccountPayload(account, user),
    temporaryPassword,
    expiresAt: temporaryPasswordExpiresAt.toISOString(),
  };
};

export const listSiUsers = async (params: ListParams) => {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  const page = Math.max(params.page ?? 1, 1);
  const result = await personnelAdapter.searchPersonnel({
    search: params.q ?? "",
    page,
    limit,
  });
  const items = result.items
    .filter((personnel) => {
      if (params.direction && personnel.direction !== params.direction) {
        return false;
      }

      if (params.fonction && personnel.fonction !== params.fonction) {
        return false;
      }

      return true;
    })
    .map((personnel): EmployeeDirectoryItem => {
      const [firstName = "", ...lastNameParts] = personnel.fullName.split(" ");

      return {
        matricule: personnel.matricule,
        firstName,
        lastName: lastNameParts.join(" "),
        direction: personnel.direction ?? null,
        fonction: personnel.fonction ?? null,
      };
    });

  return {
    items,
    total: params.direction || params.fonction ? items.length : result.total,
    page: result.page,
    limit: result.limit,
  };
};
