import type { Types } from "mongoose";

import type {
  REQUEST_STATUSES,
  REQUEST_TYPES,
} from "../constants/request.constants.js";

export type RequestType = (typeof REQUEST_TYPES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type RequestRecord = Record<string, unknown> & {
  _id: Types.ObjectId;
};

export type RequestDgReturnGuardSource = {
  _id: Types.ObjectId;
  status?: unknown;
  initialDgReviewId?: unknown;
};

export type Actor = {
  id: string;
  role: string;
  userType: "internal" | "postulant";
};
