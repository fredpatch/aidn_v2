/**
 * Preliminary phase helper rules.
 *
 * Shared file validation for Phase I meeting reports, closure courrier, DG
 * return scans, and portal pre-evaluation form uploads.
 */
import { HttpError } from "../../../shared/errors/http-error.js";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const validatePreliminaryFile = (
  file: Express.Multer.File | undefined,
  required: boolean,
  label: string,
) => {
  if (required && !file) {
    throw new HttpError(400, `${label} est requis`);
  }
  if (
    file &&
    !ALLOWED_MIME_TYPES.includes(
      file.mimetype as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new HttpError(400, `Type de fichier non supporté pour ${label}`);
  }
  return file;
};
