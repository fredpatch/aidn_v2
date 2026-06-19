import { HttpError } from "../../../shared/errors/http-error.js";
import {
  EDITABLE_STATUSES,
  INTAKE_MUTABLE_STATUSES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
} from "../constants/request.constants.js";
import type {
  Actor,
  RequestDgReturnGuardSource,
  RequestRecord,
  RequestStatus,
  RequestType,
} from "../types/request.types.js";

export const trimmed = (value?: string) => {
  const next = value?.trim();
  return next ? next : undefined;
};

export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const validateRequestType = (value?: string): RequestType => {
  if (!value || !REQUEST_TYPES.includes(value as RequestType)) {
    throw new HttpError(400, "requestType is invalid");
  }

  return value as RequestType;
};

export const validateSubject = (value?: string) => {
  const subject = trimmed(value);
  if (!subject || subject.length < 3 || subject.length > 200) {
    throw new HttpError(400, "subject must contain between 3 and 200 characters");
  }

  return subject;
};

export const validateMessage = (value?: string) => {
  const message = trimmed(value);
  if (message && message.length > 3000) {
    throw new HttpError(400, "message must contain at most 3000 characters");
  }

  return message;
};

export const validateStatus = (value?: string) => {
  if (!value) {
    return undefined;
  }

  if (!REQUEST_STATUSES.includes(value as RequestStatus)) {
    throw new HttpError(400, "status is invalid");
  }

  return value as RequestStatus;
};

export const ensureEditable = (status: string) => {
  if (!EDITABLE_STATUSES.includes(status as (typeof EDITABLE_STATUSES)[number])) {
    throw new HttpError(409, "Request cannot be modified after submission");
  }
};

export const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
};

export const ensureIntakeMutable = (status: string) => {
  if (
    !INTAKE_MUTABLE_STATUSES.includes(
      status as (typeof INTAKE_MUTABLE_STATUSES)[number],
    )
  ) {
    throw new HttpError(409, "Request cannot be processed at this stage");
  }
};

export const isDgReturnComplete = (
  request: RequestDgReturnGuardSource,
  dgReview: unknown,
) => {
  const review =
    dgReview as
      | (RequestRecord & {
          returnedScannedDocumentId?: unknown;
          status?: unknown;
        })
      | undefined;

  return (
    (request.status === "initial_dg_returned" ||
      request.status === "oriented_to_dn") &&
    (review?.status === "returned_scanned" ||
      review?.status === "decision_recorded") &&
    Boolean(review.returnedScannedDocumentId)
  );
};
