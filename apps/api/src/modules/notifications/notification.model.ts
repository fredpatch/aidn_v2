import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const notificationSchema = new Schema(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    channel: { type: String, enum: ["in_app"], default: "in_app" },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    relatedType: {
      type: String,
      enum: ["request", "dossier", "phase", "document", "meeting", "dg_review", "account_request"],
      required: true
    },
    relatedId: { type: Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ["unread", "read"], default: "unread", index: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

export type Notification = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };
export const NotificationModel = model("Notification", notificationSchema, "notifications");
