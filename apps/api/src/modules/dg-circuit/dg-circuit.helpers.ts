import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { Permissions } from "../../shared/permissions/permissions.js";
import type {
  Actor,
  DgCircuitTaskFilters,
  DgCircuitTaskSearchSource,
  DgReviewHandledByRole,
  GenericRecord,
} from "./dg-circuit.types.js";

const DG_TASK_PERMISSIONS = [
  Permissions.DG_CIRCUIT_HANDLE,
  Permissions.COURRIER_REGISTER_PHYSICAL,
  Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE,
  Permissions.DG_DECISION_RECORD,
] as const;

export const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
};

export const canViewDgCircuitTasks = (actor: Actor) =>
  DG_TASK_PERMISSIONS.some((permission) =>
    actor.permissions.includes(permission),
  );

export const ensureCanViewTasks = (actor: Actor) => {
  ensureInternalActor(actor);
  if (!canViewDgCircuitTasks(actor)) {
    throw new HttpError(403, "Missing DG circuit task permission");
  }
};

export const can = (actor: Actor, permission: string) =>
  actor.permissions.includes(permission);

export const toDgRole = (role: string): DgReviewHandledByRole => {
  const allowed: DgReviewHandledByRole[] = [
    "dg_secretariat",
    "reception",
    "bureau_courrier",
    "dn_agent",
    "admin",
  ];
  return allowed.includes(role as DgReviewHandledByRole)
    ? (role as DgReviewHandledByRole)
    : "admin";
};

export const taskMatches = (
  task: DgCircuitTaskSearchSource,
  filters: DgCircuitTaskFilters,
) => {
  if (filters.bucket) {
    if (filters.bucket === "returns_to_register") {
      if (task.bucket !== "awaiting_return") return false;
    } else if (filters.bucket === "processed") {
      if (
        task.bucket !== "returned_scanned" &&
        task.bucket !== "decision_recorded"
      ) {
        return false;
      }
    } else if ((task.bucket as string) !== filters.bucket) {
      return false;
    }
  }

  if (filters.source && task.source !== filters.source) return false;
  if (!filters.search) return true;

  const haystack = [
    task.subject,
    task.organizationName,
    task.applicantName,
    task.reference,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(filters.search.toLowerCase());
};

export const organizationName = (source: unknown) => {
  if (!source || source instanceof Types.ObjectId) return undefined;
  return String((source as GenericRecord).canonicalName ?? "");
};

export const userName = (source: unknown) => {
  if (!source || source instanceof Types.ObjectId) return undefined;
  return String((source as GenericRecord).fullName ?? "");
};
