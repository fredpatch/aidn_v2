import { MariaDataSource } from "../../shared/database/maria.datasource.js";
import { EmployeeDirectory } from "../../shared/database/views/employee-directory.view.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { Roles, type Role } from "../../shared/permissions/permissions.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { AccountRequestModel } from "../account-requests/account-request.model.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { PostulantOrganizationModel } from "../organizations/postulant-organization.model.js";
import { personnelAdapter } from "../personnel/personnel.service.js";
import { AidnInternalAccountModel } from "../users/aidn-internal-account.model.js";
import { UserModel } from "../users/user.model.js";

const activatableInternalRoles: Role[] = [
  Roles.ADMIN,
  Roles.DN_SUPERVISOR,
  Roles.DN_AGENT,
  Roles.DG_SECRETARIAT,
  Roles.RECEPTION,
  Roles.BUREAU_COURRIER,
];

const normalizeMatricule = (matricule: string) => matricule.trim().toUpperCase();

const generateTemporaryPassword = () =>
  crypto.randomInt(100000, 1000000).toString();

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

export const searchPersonnel = async (params: {
  search: string;
  page: number;
  limit: number;
}) => {
  const result = await personnelAdapter.searchPersonnel(params);
  const personnelIds = result.items.map((item) => item.personnelId);
  const accounts = await AidnInternalAccountModel.find({
    personnelSource: "official_personnel_db",
    personnelId: { $in: personnelIds },
  }).lean();
  const accountByPersonnelId = new Map(
    accounts.map((account) => [account.personnelId, account]),
  );

  return {
    items: result.items.map((personnel) => {
      const account = accountByPersonnelId.get(personnel.personnelId);

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
        lastLoginAt: account.lastLoginAt?.toISOString(),
      };
    });
};

export const activateInternalAccount = async (input: {
  personnelId: string;
  role: Role;
  activatedById: string;
  activatedByRole: Role;
}) => {
  const role = input.role;

  if (!activatableInternalRoles.includes(role)) {
    throw new HttpError(400, "Invalid internal activation role");
  }

  if (!input.personnelId?.trim()) {
    throw new HttpError(400, "personnelId is required");
  }

  const personnel = await personnelAdapter.getPersonnelById(
    input.personnelId.trim(),
  );

  if (!personnel) {
    throw new HttpError(404, "Personnel record not found");
  }

  if (personnel.isActive === false) {
    throw new HttpError(400, "Cannot activate inactive personnel");
  }

  const existingAccount = await AidnInternalAccountModel.findOne({
    personnelSource: "official_personnel_db",
    personnelId: personnel.personnelId,
  }).lean();
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const now = new Date();
  const temporaryPasswordExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const user = await UserModel.findOneAndUpdate(
    {
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
    {
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
    },
    temporaryPassword,
  };
};

export const listOrganizations = async () => {
  return PostulantOrganizationModel.find().sort({ canonicalName: 1 }).lean();
};

export const listAccountRequests = async () => {
  return AccountRequestModel.find().sort({ createdAt: -1 }).lean();
};

export const listSiUsers = async (params: ListParams) => {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  const page = Math.max(params.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const repo = MariaDataSource.getRepository(EmployeeDirectory);
  const qb = repo.createQueryBuilder("e");

  // q search (matricule, firstName, lastName)
  if (params.q?.trim()) {
    const q = `%${params.q.trim()}%`;
    qb.andWhere(
      `(e.matricule LIKE :q OR e.firstName LIKE :q OR e.lastName LIKE :q)`,
      { q },
    );
  }

  if (params.direction) {
    qb.andWhere(`e.direction = :direction`, { direction: params.direction });
  }

  if (params.fonction) {
    qb.andWhere(`e.fonction = :fonction`, { fonction: params.fonction });
  }

  qb.orderBy("e.matricule", "ASC").skip(skip).take(limit);

  const [items, total] = await qb.getManyAndCount();

  return { items, total, page, limit };
};
