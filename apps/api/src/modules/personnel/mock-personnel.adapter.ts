import type { PersonnelAdapter, PersonnelIdentity, PersonnelSearchParams, PersonnelSearchResult } from "./personnel.types.js";

const personnel: PersonnelIdentity[] = [
  {
    personnelId: "sigem-1001",
    matricule: "DN1001",
    fullName: "Aminata Diallo",
    email: "aminata.diallo@anac.local",
    service: "Navigabilite",
    fonction: "Agent DN",
    direction: "DN",
    isActive: true
  },
  {
    personnelId: "sigem-1002",
    matricule: "BC1002",
    fullName: "Moussa Traore",
    email: "moussa.traore@anac.local",
    service: "Bureau courrier",
    fonction: "Agent courrier",
    direction: "DG",
    isActive: true
  },
  {
    personnelId: "sigem-1003",
    matricule: "DG1003",
    fullName: "Fatou Sow",
    email: "fatou.sow@anac.local",
    service: "Secretariat DG",
    fonction: "Secretariat",
    direction: "DG",
    isActive: true
  }
];

export class MockPersonnelDbAdapter implements PersonnelAdapter {
  async searchPersonnel(params: PersonnelSearchParams): Promise<PersonnelSearchResult> {
    const normalized = params.search.trim().toLowerCase();
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const page = Math.max(params.page ?? 1, 1);
    const skip = (page - 1) * limit;

    const filtered = !normalized
      ? personnel
      : personnel.filter((record) =>
          [record.matricule, record.fullName, record.email, record.service, record.direction, record.fonction]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalized))
        );

    return {
      items: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  async getPersonnelById(personnelId: string): Promise<PersonnelIdentity | null> {
    return personnel.find((record) => record.personnelId === personnelId) ?? null;
  }

  async getPersonnelByMatricule(matricule: string): Promise<PersonnelIdentity | null> {
    const normalized = matricule.trim().toUpperCase();
    return personnel.find((record) => record.matricule === normalized) ?? null;
  }
}
