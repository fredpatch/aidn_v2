import { MariaDataSource } from "../../shared/database/maria.datasource.js";
import { EmployeeDirectory } from "../../shared/database/views/employee-directory.view.js";
import { derivePersonnelEmail } from "./personnel-email.js";
import type { PersonnelAdapter, PersonnelIdentity, PersonnelSearchParams, PersonnelSearchResult } from "./personnel.types.js";

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

  async searchPersonnel(params: PersonnelSearchParams): Promise<PersonnelSearchResult> {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const page = Math.max(params.page ?? 1, 1);
    const skip = (page - 1) * limit;
    const qb = this.repo
      .createQueryBuilder("employee")
      .orderBy("employee.matricule", "ASC")
      .skip(skip)
      .take(limit);
    const normalized = params.search.trim();

    if (normalized) {
      const q = `%${normalized}%`;
      qb.where(
        "employee.matricule LIKE :q OR employee.firstName LIKE :q OR employee.lastName LIKE :q OR employee.direction LIKE :q OR employee.fonction LIKE :q",
        { q },
      );
    }

    const [employees, total] = await qb.getManyAndCount();

    return {
      items: employees.map(toIdentity),
      total,
      page,
      limit,
    };
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
