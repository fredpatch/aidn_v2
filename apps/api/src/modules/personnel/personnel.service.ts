import { env } from "../../shared/config/env.js";
import { MariaPersonnelAdapter } from "./maria-personnel.adapter.js";
import { MockPersonnelDbAdapter } from "./mock-personnel.adapter.js";
import type { PersonnelAdapter } from "./personnel.types.js";

const createPersonnelAdapter = (): PersonnelAdapter => {
  if (env.officialPersonnelDbEnabled) {
    return new MariaPersonnelAdapter();
  }

  if (env.mockPersonnelEnabled) {
    return new MockPersonnelDbAdapter();
  }

  throw new Error(
    "No personnel adapter configured. Set OFFICIAL_PERSONNEL_DB_ENABLED=true or MOCK_PERSONNEL_ENABLED=true.",
  );
};

export const personnelAdapter: PersonnelAdapter = createPersonnelAdapter();
