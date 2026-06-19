export type AuthUser = {
  id: string;
  userType: 'internal' | 'postulant';
  fullName: string;
  email?: string;
  matricule?: string;
  role: string;
  permissions: string[];
  mustChangePassword?: boolean;
};

export type LoginResponse = {
  requiresPasswordChange?: boolean;
  user: AuthUser;
};
