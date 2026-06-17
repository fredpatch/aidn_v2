import { env } from "../../shared/config/env.js";
import { ApiPersonnelAdapter } from "./api-personnel.adapter.js";
import { MariaPersonnelAdapter } from "./maria-personnel.adapter.js";
import { MockPersonnelDbAdapter } from "./mock-personnel.adapter.js";
import type { PersonnelAdapter } from "./personnel.types.js";

const createPersonnelAdapter = (): PersonnelAdapter => {
  if (env.personnelSource === "api") {
    return new ApiPersonnelAdapter();
  }

  if (env.personnelSource === "maria") {
    return new MariaPersonnelAdapter();
  }

  if (env.personnelSource === "mock") {
    return new MockPersonnelDbAdapter();
  }

  throw new Error(
    "No personnel adapter configured. Set PERSONNEL_SOURCE=api, PERSONNEL_SOURCE=maria, or PERSONNEL_SOURCE=mock.",
  );
};

export const personnelAdapter: PersonnelAdapter = createPersonnelAdapter();
