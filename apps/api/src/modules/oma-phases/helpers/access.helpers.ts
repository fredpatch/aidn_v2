import { HttpError } from "../../../shared/errors/http-error.js";
import type { Actor } from "../types/oma.types.js";

export const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
};
