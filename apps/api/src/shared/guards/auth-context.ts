import type { Role } from "../permissions/permissions.js";

export interface AuthUser {
  id: string;
  role: Role;
  userType: "internal" | "postulant";
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
