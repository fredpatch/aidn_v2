import type { Types } from "mongoose";

export type Actor = {
  id: string;
  role: string;
  userType: "internal" | "postulant";
};

export type GenericRecord = Record<string, unknown> & {
  _id: Types.ObjectId;
};
