export interface PersonnelIdentity {
  personnelId: string;
  matricule: string;
  fullName: string;
  email?: string;
  phone?: string;
  service?: string;
  direction?: string;
  fonction?: string;
  isActive?: boolean;
}

export interface PersonnelAdapter {
  searchPersonnel(search: string): Promise<PersonnelIdentity[]>;
  getPersonnelById(personnelId: string): Promise<PersonnelIdentity | null>;
  getPersonnelByMatricule(matricule: string): Promise<PersonnelIdentity | null>;
}
