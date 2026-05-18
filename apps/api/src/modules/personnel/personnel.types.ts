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

export interface PersonnelSearchParams {
  search: string;
  page: number;
  limit: number;
}

export interface PersonnelSearchResult {
  items: PersonnelIdentity[];
  total: number;
  page: number;
  limit: number;
}

export interface PersonnelAdapter {
  searchPersonnel(params: PersonnelSearchParams): Promise<PersonnelSearchResult>;
  getPersonnelById(personnelId: string): Promise<PersonnelIdentity | null>;
  getPersonnelByMatricule(matricule: string): Promise<PersonnelIdentity | null>;
}
