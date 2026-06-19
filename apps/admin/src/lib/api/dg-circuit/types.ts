export type DgCircuitBucket =
  | 'to_transmit'
  | 'awaiting_return'
  | 'returns_to_register'
  | 'returned_scanned'
  | 'decision_recorded'
  | 'processed';

export type DgCircuitSource = 'initial_request' | 'pre_evaluation' | 'formal_request';

export type DgCircuitAction =
  | 'download_outgoing'
  | 'mark_transmitted'
  | 'record_physical_receipt'
  | 'record_annotated_return'
  | 'download_annotated_return'
  | 'record_dg_decision';

export type DgCircuitTask = {
  id: string;
  source: DgCircuitSource;
  bucket: DgCircuitBucket;
  subject: string;
  organizationName?: string;
  applicantName?: string;
  reference?: string;
  requestId?: string;
  dossierId?: string;
  phaseId?: string;
  status: string;
  documentToTransmitId?: string;
  annotatedReturnDocumentId?: string;
  submittedAt?: string;
  transmittedAt?: string;
  returnedAt?: string;
  processedAt?: string;
  sentToDgAt?: string;
  returnedFromDgAt?: string;
  decisionRecordedAt?: string;
  decision?: string;
  orientedDirection?: string;
  observations?: string;
  handledByRole?: string;
  availableActions: DgCircuitAction[];
};

export type DgCircuitTasksResponse = {
  items: DgCircuitTask[];
  counts: {
    toTransmit: number;
    awaitingReturn: number;
    returnedScanned: number;
    decisionRecorded: number;
    processed: number;
  };
};

export type DgCircuitTaskFilters = {
  bucket?: string;
  source?: string;
  search?: string;
};
