import type { Request, Response } from "express";

import {
  downloadDgCircuitTaskDocument,
  listDgCircuitTasks,
} from "./dg-circuit.service.js";

export const listDgCircuitTasksController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const limit =
    typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

  res.json(
    await listDgCircuitTasks(
      {
        bucket:
          typeof req.query.bucket === "string" ? req.query.bucket : undefined,
        source:
          typeof req.query.source === "string" ? req.query.source : undefined,
        search:
          typeof req.query.search === "string" ? req.query.search : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
      },
      req.user!,
    ),
  );
};

export const downloadDgCircuitTaskDocumentController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { buffer, mimeType, fileName } = await downloadDgCircuitTaskDocument(
    String(req.params.taskId),
    String(req.params.documentId),
    req.user!,
  );

  res.set("Content-Type", mimeType);
  res.set(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(fileName)}"`,
  );
  res.set("Content-Length", String(buffer.length));
  res.end(buffer);
};
