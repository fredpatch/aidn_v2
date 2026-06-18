import type { DgCircuitTask } from "@/lib/api/dg-circuit.api";

export type DgCircuitTaskCounts = {
  toTransmit: number;
  awaitingReturn: number;
  returnedScanned: number;
  decisionRecorded: number;
  processed: number;
};

export type DgCircuitModalState =
  | { kind: "transmit-confirm"; task: DgCircuitTask }
  | { kind: "dg-return"; task: DgCircuitTask }
  | { kind: "physical-receipt"; task: DgCircuitTask }
  | null;
