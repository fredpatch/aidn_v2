import type { Types } from "mongoose";

export type Actor = {
  id: string;
  role: string;
  userType: "internal" | "postulant";
  permissions: string[];
};

export type TaskBucket =
  | "to_transmit"
  | "awaiting_return"
  | "returned_scanned"
  | "decision_recorded";

export type TaskSource = "initial_request" | "pre_evaluation" | "formal_request";

export type GenericRecord = Record<string, unknown> & { _id: Types.ObjectId };

export type DgReviewHandledByRole =
  | "dg_secretariat"
  | "reception"
  | "bureau_courrier"
  | "dn_agent"
  | "admin";

export type DgCircuitTaskFilters = {
  bucket?: string;
  source?: string;
  search?: string;
  limit?: number;
};

export type DgCircuitTaskSearchSource = {
  bucket: TaskBucket;
  source: TaskSource;
  subject: string;
  organizationName?: string;
  applicantName?: string;
  reference?: string;
};
