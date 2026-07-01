export type ResetTestDataPayload = {
  confirmation: string;
  deleteUploadedFiles?: boolean;
  includeAuditLogs?: boolean;
  includeNotifications?: boolean;
};

export type ResetTestDataResult = {
  ok: boolean;
  counts: Record<string, number>;
  deletedFiles: number;
};
