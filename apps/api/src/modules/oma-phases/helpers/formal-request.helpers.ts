import { HttpError } from "../../../shared/errors/http-error.js";
import type { GenericRecord } from "../types/oma.types.js";
import {
  ACTIVE_SUBMISSION_STATUSES,
  SUPPORTING_DOC_CATEGORY,
} from "../constants/formal-request.constants.js";

export const validateFormalRequestFile = (
  file: Express.Multer.File | undefined,
) => {
  if (!file) throw new HttpError(400, "Un fichier est requis.");
};

export const computeRequirementStatus = (
  submissions: GenericRecord[],
): string => {
  const active = submissions
    .filter((s) => ACTIVE_SUBMISSION_STATUSES.has(String(s.status)))
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(String(a.createdAt)).getTime() : 0;
      const bTime = b.createdAt ? new Date(String(b.createdAt)).getTime() : 0;
      return bTime - aTime;
    });

  if (active.length === 0) return "missing";
  return String(active[0].status);
};

export const mapRequirementToDocumentCategory = (
  reqDocType: string,
): string => SUPPORTING_DOC_CATEGORY[reqDocType] ?? "other";

export const assertPhaseNotClosed = (phase: { status: unknown }) => {
  if (phase.status === "closed") {
    throw new HttpError(409, "La phase de demande formelle est déjà clôturée.");
  }
};

export const assertFormalRequestGateExists = (phase: {
  formalRequestCourrierId?: unknown;
}) => {
  if (!phase.formalRequestCourrierId) {
    throw new HttpError(
      409,
      "Le courrier de demande formelle n'a pas encore été enregistré.",
    );
  }
};

export const assertNoFormalDgReviewYet = (phase: {
  formalRequestDgReviewId?: unknown;
}) => {
  if (phase.formalRequestDgReviewId) {
    throw new HttpError(
      409,
      "La demande formelle a déjà été transmise au circuit DG.",
    );
  }
};

export const assertFormalDgDecisionRecorded = (phase: {
  formalRequestStatus?: unknown;
}) => {
  const status = phase.formalRequestStatus as string | undefined;
  const dgEvidenceReady =
    status === "formal_dg_decision_recorded" || status === "formal_dg_returned";
  if (!dgEvidenceReady) {
    throw new HttpError(
      409,
      "Le retour DG scanné doit être enregistré avant de planifier la réunion formelle.",
    );
  }
};

export const assertNoFormalMeetingYet = (phase: {
  formalMeetingId?: unknown;
}) => {
  if (phase.formalMeetingId) {
    throw new HttpError(
      409,
      "Une réunion formelle a déjà été planifiée pour cette phase.",
    );
  }
};
