import type { PersonnelAdapter, PersonnelIdentity } from "./personnel.types.js";

const personnel: PersonnelIdentity[] = [
  {
    personnelId: "sigem-1001",
    matricule: "DN1001",
    fullName: "Aminata Diallo",
    email: "aminata.diallo@anac.local",
    service: "Navigabilite",
    direction: "DN",
    isActive: true
  },
  {
    personnelId: "sigem-1002",
    matricule: "BC1002",
    fullName: "Moussa Traore",
    email: "moussa.traore@anac.local",
    service: "Bureau courrier",
    direction: "DG",
    isActive: true
  },
  {
    personnelId: "sigem-1003",
    matricule: "DG1003",
    fullName: "Fatou Sow",
    email: "fatou.sow@anac.local",
    service: "Secretariat DG",
    direction: "DG",
    isActive: true
  }
];

export class MockPersonnelDbAdapter implements PersonnelAdapter {
  async searchPersonnel(search: string): Promise<PersonnelIdentity[]> {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return personnel;
    }

    return personnel.filter((record) =>
      [record.matricule, record.fullName, record.email, record.service, record.direction]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))
    );
  }

  async getPersonnelById(personnelId: string): Promise<PersonnelIdentity | null> {
    return personnel.find((record) => record.personnelId === personnelId) ?? null;
  }

  async findByMatricule(matricule: string): Promise<PersonnelIdentity | null> {
    const normalized = matricule.trim().toUpperCase();
    return personnel.find((record) => record.matricule === normalized) ?? null;
  }

  async authenticateByMatricule(matricule: string, password: string): Promise<PersonnelIdentity | null> {
    const record = await this.findByMatricule(matricule);

    if (!record || !record.isActive) {
      return null;
    }

    return password === "mock-password" ? record : null;
  }
}
