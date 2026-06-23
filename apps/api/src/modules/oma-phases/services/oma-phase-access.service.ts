/**
 * OMA phase portal access slice.
 *
 * Owns postulant actor resolution and dossier ownership checks shared by
 * portal-facing preliminary, formal request, and document-evaluation flows.
 */
import { HttpError } from "../../../shared/errors/http-error.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { UserModel } from "../../users/user.model.js";
import type { Actor } from "../types/oma.types.js";

const resolvePortalUser = async (actor: Actor) => {
  if (actor.userType !== "postulant") {
    throw new HttpError(403, "Portal access denied");
  }

  const user = await UserModel.findById(actor.id)
    .select("userType organizationId role isActive")
    .lean();
  if (!user || user.userType !== "postulant" || !user.isActive) {
    throw new HttpError(403, "Portal access denied");
  }
  if (!user.organizationId) {
    throw new HttpError(400, "Portal user must be linked to an organization");
  }

  return { userId: user._id, organizationId: user.organizationId };
};

export const getOwnedDossier = async (dossierId: string, actor: Actor) => {
  const portalUser = await resolvePortalUser(actor);
  const dossier = await DossierModel.findOne({
    _id: ensureObjectId(dossierId, "id"),
    postulantUserId: portalUser.userId,
  });
  if (!dossier) {
    throw new HttpError(404, "Dossier introuvable");
  }

  return { dossier, portalUser };
};
