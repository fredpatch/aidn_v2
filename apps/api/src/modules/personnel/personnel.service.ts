import { MockPersonnelDbAdapter } from "./mock-personnel.adapter.js";
import type { PersonnelAdapter } from "./personnel.types.js";

// TODO: Replace this mock with the official MySQL/SIGEM personnel adapter.
export const personnelAdapter: PersonnelAdapter = new MockPersonnelDbAdapter();
