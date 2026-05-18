import { MariaDataSource } from "../../shared/database/maria.datasource.js";
import { EmployeeDirectory } from "../../shared/database/views/employee-directory.view.js";
import { derivePersonnelEmail } from "./personnel-email.js";
import type { PersonnelAdapter, PersonnelIdentity } from "./personnel.types.js";

const normalizeMatricule = (matricule: string) => matricule.trim().toUpperCase();

const toIdentity = (employee: EmployeeDirectory): PersonnelIdentity => {
  const firstName = employee.firstName?.trim() ?? "";
  const lastName = employee.lastName?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || employee.matricule;

  return {
    personnelId: employee.matricule,
    matricule: employee.matricule,
    fullName,
    email: derivePersonnelEmail(firstName, lastName),
    direction: employee.direction ?? undefined,
    fonction: employee.fonction ?? undefined,
  };
};

export class MariaPersonnelAdapter implements PersonnelAdapter {
  private get repo() {
    return MariaDataSource.getRepository(EmployeeDirectory);
  }

  async searchPersonnel(search: string): Promise<PersonnelIdentity[]> {
    const qb = this.repo.createQueryBuilder("employee").orderBy("employee.matricule", "ASC").take(50);
    const normalized = search.trim();

    if (normalized) {
      const q = `%${normalized}%`;
      qb.where(
        "employee.matricule LIKE :q OR employee.firstName LIKE :q OR employee.lastName LIKE :q OR employee.direction LIKE :q OR employee.fonction LIKE :q",
        { q },
      );
    }

    const employees = await qb.getMany();
    return employees.map(toIdentity);
  }

  async getPersonnelById(personnelId: string): Promise<PersonnelIdentity | null> {
    return this.getPersonnelByMatricule(personnelId);
  }

  async getPersonnelByMatricule(matricule: string): Promise<PersonnelIdentity | null> {
    const normalized = normalizeMatricule(matricule);

    if (!normalized) {
      return null;
    }

    const employee = await this.repo.findOne({ where: { matricule: normalized } });
    return employee ? toIdentity(employee) : null;
  }
}
