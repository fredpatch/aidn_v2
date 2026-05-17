import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const meetingSchema = new Schema(
  {
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", required: true, index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "OmaPhase", required: true, index: true },
    meetingType: {
      type: String,
      enum: ["first_contact_meeting", "preliminary_meeting", "formal_meeting", "inspection_meeting", "other"],
      required: true
    },
    title: { type: String, required: true, trim: true },
    scheduledAt: { type: Date },
    location: { type: String, trim: true },
    status: { type: String, enum: ["planned", "invited", "held", "postponed", "cancelled"], default: "planned", index: true },
    outlookEmailStatus: {
      type: String,
      enum: ["not_required", "to_be_sent_manually", "sent_manually"],
      default: "not_required"
    },
    outlookEmailSentAt: { type: Date },
    outlookEmailRecordedById: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, trim: true },
    reportDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export type Meeting = InferSchemaType<typeof meetingSchema> & { _id: Types.ObjectId };
export const MeetingModel = model("Meeting", meetingSchema, "meetings");
