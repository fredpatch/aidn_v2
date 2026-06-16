import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { env } from "../../shared/config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { AuditLogModel } from "../audit/audit-log.model.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { MeetingModel } from "../meetings/meeting.model.js";
import { NotificationModel } from "../notifications/notification.model.js";
import { OmaPhaseModel } from "../oma-phases/oma-phase.model.js";
import { RequestModel } from "../requests/request.model.js";

const CONFIRMATION_TEXT = "RESET AIDN TEST DATA";

type Actor = { id: string; role: string; userType: "internal" | "postulant" };

export const resetTestData = async (
  input: {
    confirmation: string;
    deleteUploadedFiles?: boolean;
    includeAuditLogs?: boolean;
    includeNotifications?: boolean;
  },
  actor: Actor,
) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Accès refusé.");
  }

  if (!env.allowDevDataReset) {
    throw new HttpError(
      403,
      "La réinitialisation des données de test est désactivée. Activez ALLOW_DEV_DATA_RESET=true.",
    );
  }

  if (env.nodeEnv === "production") {
    throw new HttpError(
      403,
      "La réinitialisation des données est bloquée en production.",
    );
  }

  if (input.confirmation !== CONFIRMATION_TEXT) {
    throw new HttpError(
      400,
      `Texte de confirmation incorrect. Attendu : "${CONFIRMATION_TEXT}"`,
    );
  }

  const includeAuditLogs = input.includeAuditLogs !== false;
  const includeNotifications = input.includeNotifications !== false;
  const deleteUploadedFiles = input.deleteUploadedFiles === true;

  if (includeAuditLogs) {
    console.warn(
      `[DEV-RESET] Data reset initiated by actor ${actor.id} (${actor.role}) at ${new Date().toISOString()}. Audit logs will be deleted.`,
    );
  }

  const [
    requests,
    courriers,
    dossiers,
    omaphases,
    documents,
    meetings,
    dgreviews,
  ] = await Promise.all([
    RequestModel.deleteMany({}).then((r) => r.deletedCount),
    CourrierModel.deleteMany({}).then((r) => r.deletedCount),
    DossierModel.deleteMany({}).then((r) => r.deletedCount),
    OmaPhaseModel.deleteMany({}).then((r) => r.deletedCount),
    DocumentModel.deleteMany({}).then((r) => r.deletedCount),
    MeetingModel.deleteMany({}).then((r) => r.deletedCount),
    DGReviewModel.deleteMany({}).then((r) => r.deletedCount),
  ]);

  const counts: Record<string, number> = {
    requests,
    courriers,
    dossiers,
    omaphases,
    documents,
    meetings,
    dgreviews,
  };

  if (includeNotifications) {
    counts.notifications = (
      await NotificationModel.deleteMany({})
    ).deletedCount;
  }

  if (includeAuditLogs) {
    counts.auditlogs = (await AuditLogModel.deleteMany({})).deletedCount;
  }

  let deletedFiles = 0;
  if (deleteUploadedFiles) {
    const storageRoot = resolve(process.cwd(), env.uploadStorageDir);
    try {
      const entries = await readdir(storageRoot);
      await Promise.all(
        entries.map((entry) =>
          rm(resolve(storageRoot, entry), { recursive: true, force: true }),
        ),
      );
      deletedFiles = entries.length;
    } catch {
      // Storage directory may not exist yet - not an error
    }
  }

  return { ok: true, counts, deletedFiles };
};
