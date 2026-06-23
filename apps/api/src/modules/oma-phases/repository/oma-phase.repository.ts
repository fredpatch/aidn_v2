/**
 * OMA phase repository.
 *
 * Centralizes shared phase data reads for preliminary, formal request, and
 * admin read services. Batch methods reduce N+1 queries for document and
 * requirement lookups.
 */
import { Types } from "mongoose";

import { CourrierModel } from "../../courriers/courrier.model.js";
import { DocumentModel } from "../../documents/document.model.js";
import { RequestModel } from "../../requests/request.model.js";
import type { GenericRecord } from "../types/oma.types.js";

export const omaPhaseRepository = {
  // Phase reads
  findOmaPhaseByKeyLean: async (dossierId: Types.ObjectId, phaseKey: string) =>
    (await (
      await import("../models/oma-phase.model.js")
    ).OmaPhaseModel.findOne({
      dossierId,
      phaseKey,
    }).lean()) as GenericRecord | null,

  findAllOmaPhasesByDossierIdLean: async (dossierId: Types.ObjectId) =>
    (await (
      await import("../models/oma-phase.model.js")
    ).OmaPhaseModel.find({
      dossierId,
    }).lean()) as GenericRecord[],

  // Request and courrier reads
  findRequestByIdLean: async (requestId: Types.ObjectId) =>
    (await RequestModel.findById(requestId).lean()) as GenericRecord | null,

  findCourrierByIdLean: async (courrierId: Types.ObjectId) =>
    (await CourrierModel.findById(courrierId).lean()) as GenericRecord | null,

  // Batch document reads
  findDocumentsByIds: async (documentIds: Types.ObjectId[]) =>
    (await DocumentModel.find({
      _id: { $in: documentIds },
    }).lean()) as GenericRecord[],

  // Batch requirement reads via shared import
  findDocumentRequirementsByIds: async (requirementIds: Types.ObjectId[]) => {
    const { DocumentRequirementModel } =
      await import("../../documents/document-requirement.model.js");
    return (await DocumentRequirementModel.find({
      _id: { $in: requirementIds },
    }).lean()) as GenericRecord[];
  },
};
