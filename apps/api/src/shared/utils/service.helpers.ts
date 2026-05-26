import { Types } from "mongoose";

import { HttpError } from "../errors/http-error.js";

export const ensureObjectId = (id: string, label: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `${label} is invalid`);
  }
  return new Types.ObjectId(id);
};

export const toIso = (value: unknown): string | undefined =>
  value instanceof Date
    ? value.toISOString()
    : value
      ? new Date(String(value)).toISOString()
      : undefined;

export const toId = (value: unknown): string | undefined => value?.toString();

export const parseDate = (value: unknown, label: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${label} must be a valid date`);
  }
  return date;
};

export const parseOptionalDate = parseDate;
