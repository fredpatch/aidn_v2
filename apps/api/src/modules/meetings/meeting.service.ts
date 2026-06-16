import { Types } from "mongoose";

import { DossierModel } from "../dossiers/dossier.model.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { ensureObjectId, parseDate, toIso } from "../../shared/utils/service.helpers.js";
import { MeetingModel } from "./meeting.model.js";

type Actor = { id: string; role: string; userType: "internal" | "postulant" };

const MEETING_STATUSES = ["planned", "invited", "held", "postponed", "cancelled"] as const;
type MeetingStatus = (typeof MEETING_STATUSES)[number];

const ensurePortalActor = (actor: Actor) => {
  if (actor.userType !== "postulant") {
    throw new HttpError(403, "Portal access denied");
  }
};

const validateStatus = (value?: string) => {
  if (!value || value === "all") {
    return undefined;
  }

  if (!MEETING_STATUSES.includes(value as MeetingStatus)) {
    throw new HttpError(400, "status is invalid");
  }

  return value as MeetingStatus;
};

const defaultDateWindow = () => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  from.setHours(0, 0, 0, 0);

  const to = new Date(now);
  to.setDate(to.getDate() + 180);
  to.setHours(23, 59, 59, 999);

  return { from, to };
};

export const listPortalMeetings = async (
  params: {
    from?: string;
    to?: string;
    status?: string;
  },
  actor: Actor,
) => {
  ensurePortalActor(actor);

  const postulantUserId = ensureObjectId(actor.id, "actor id");
  const dossiers = await DossierModel.find({ postulantUserId })
    .select("_id dossierNumber dossierType")
    .lean();

  if (dossiers.length === 0) {
    return { items: [] };
  }

  const dossierById = new Map(
    dossiers.map((dossier) => [
      dossier._id.toString(),
      {
        dossierNumber: String(dossier.dossierNumber ?? ""),
        dossierType: String(dossier.dossierType ?? ""),
      },
    ]),
  );

  const dossierIds = dossiers.map((dossier) => dossier._id);
  const status = validateStatus(params.status);
  const explicitFrom = parseDate(params.from, "from");
  const explicitTo = parseDate(params.to, "to");
  if (explicitFrom && explicitTo && explicitFrom.getTime() > explicitTo.getTime()) {
    throw new HttpError(400, "from must be before to");
  }

  const window = !explicitFrom && !explicitTo ? defaultDateWindow() : undefined;
  const from = explicitFrom ?? window?.from;
  const to = explicitTo ?? window?.to;

  const scheduledAtQuery: Record<string, Date> = {};
  if (from) scheduledAtQuery.$gte = from;
  if (to) scheduledAtQuery.$lte = to;

  const query: Record<string, unknown> = {
    dossierId: { $in: dossierIds },
  };

  if (Object.keys(scheduledAtQuery).length > 0 && window) {
    query.$or = [
      { scheduledAt: scheduledAtQuery },
      { scheduledAt: { $exists: false } },
      { scheduledAt: null },
    ];
  } else if (Object.keys(scheduledAtQuery).length > 0) {
    query.scheduledAt = scheduledAtQuery;
  }

  if (status) {
    query.status = status;
  }

  const meetings = await MeetingModel.find(query).lean();

  const sorted = meetings.sort((a, b) => {
    const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    if (aTime !== bTime) return aTime - bTime;
    return String(a.title ?? "").localeCompare(String(b.title ?? ""), "fr");
  });

  return {
    items: sorted.flatMap((meeting) => {
      const dossierId = meeting.dossierId?.toString();
      const dossier = dossierId ? dossierById.get(dossierId) : undefined;
      if (!dossierId || !dossier) {
        return [];
      }

      return [
        {
          id: meeting._id.toString(),
          dossierId,
          dossierNumber: dossier.dossierNumber,
          dossierType: dossier.dossierType,
          meetingType: String(meeting.meetingType ?? ""),
          title: String(meeting.title ?? ""),
          scheduledAt: toIso(meeting.scheduledAt),
          location: meeting.location ? String(meeting.location) : undefined,
          status: String(meeting.status ?? "planned") as MeetingStatus,
          notes: meeting.notes ? String(meeting.notes) : undefined,
          phaseKey: null,
          createdAt: toIso(meeting.createdAt) ?? new Date().toISOString(),
          updatedAt: toIso(meeting.updatedAt) ?? new Date().toISOString(),
        },
      ];
    }),
  };
};
