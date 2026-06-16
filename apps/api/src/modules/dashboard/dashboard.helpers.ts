import { HttpError } from "../../shared/errors/http-error.js";
import { Roles, type Role } from "../../shared/permissions/permissions.js";
import type {
  DashboardPeriod,
  DashboardProfile,
  DashboardQuery,
} from "./dashboard.types.js";

export const toIso = (value: Date | string | undefined | null) =>
  value ? new Date(value).toISOString() : undefined;

const endOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const parseDate = (value: string, label: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, `Invalid ${label} date`);
  }
  return parsed;
};

export const resolveDashboardPeriod = (
  query: DashboardQuery,
  now = new Date(),
): { period: DashboardPeriod; fromDate: Date; toDate: Date } => {
  const hasCustomRange = Boolean(query.from || query.to);

  if (hasCustomRange) {
    if (!query.from || !query.to) {
      throw new HttpError(400, "Both from and to are required for a custom period");
    }

    const fromDate = startOfDay(parseDate(query.from, "from"));
    const toDate = endOfDay(parseDate(query.to, "to"));

    if (fromDate.getTime() > toDate.getTime()) {
      throw new HttpError(400, "from must be before to");
    }

    return {
      period: {
        preset: "custom",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      fromDate,
      toDate,
    };
  }

  if (query.preset && query.preset !== "month") {
    const preset = query.preset;

    if (preset === "today") {
      const fromDate = startOfDay(now);
      const toDate = endOfDay(now);
      return {
        period: { preset, from: fromDate.toISOString(), to: toDate.toISOString() },
        fromDate,
        toDate,
      };
    }

    if (preset === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      const fromDate = startOfDay(start);
      const toDate = endOfDay(now);
      return {
        period: { preset, from: fromDate.toISOString(), to: toDate.toISOString() },
        fromDate,
        toDate,
      };
    }

    if (preset === "year") {
      const fromDate = startOfDay(new Date(now.getFullYear(), 0, 1));
      const toDate = endOfDay(now);
      return {
        period: { preset, from: fromDate.toISOString(), to: toDate.toISOString() },
        fromDate,
        toDate,
      };
    }

    throw new HttpError(400, "Unsupported dashboard preset");
  }

  const fromDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const toDate = endOfDay(now);

  return {
    period: {
      preset: "month",
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    fromDate,
    toDate,
  };
};

export const getDashboardProfile = (role: Role): DashboardProfile => {
  if (
    role === Roles.DG_SECRETARIAT ||
    role === Roles.RECEPTION ||
    role === Roles.BUREAU_COURRIER
  ) {
    return "courrier_dg";
  }

  return "dn_full";
};

export const countElapsedBusinessDays = (from: Date, to = new Date()) => {
  const current = startOfDay(from);
  const end = startOfDay(to);
  let count = 0;

  current.setDate(current.getDate() + 1);

  while (current.getTime() <= end.getTime()) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};
