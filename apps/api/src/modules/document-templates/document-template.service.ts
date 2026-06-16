import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { storageAdapter } from "../../shared/storage/storage.adapter.js";
import { DocumentModel } from "../documents/document.model.js";
import { DocumentTemplateModel } from "./document-template.model.js";
import { ensureObjectId } from "../../shared/utils/service.helpers.js";

type Actor = { id: string; role: string; userType: "internal" | "postulant" };

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const createDocumentTemplate = async (
  file: Express.Multer.File | undefined,
  input: { code: string; title: string; documentType: string; phaseKey?: string },
  actor: Actor,
) => {
  if (actor.userType !== "internal") throw new HttpError(403, "Internal access required");

  if (!file) throw new HttpError(400, "Fichier requis");
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new HttpError(400, "Type de fichier non supporté");
  }

  const code = input.code?.trim().toUpperCase();
  if (!code) throw new HttpError(400, "Code requis");
  if (!input.title?.trim()) throw new HttpError(400, "Titre requis");

  const stored = await storageAdapter.save({
    buffer: file.buffer,
    fileName: file.originalname,
    mimeType: file.mimetype,
    ownerPath: `document-templates/${code}`,
  });

  const doc = await DocumentModel.create({
    ownerType: "document_template",
    ownerId: new Types.ObjectId(),
    category: "template",
    documentType: input.documentType,
    title: input.title.trim(),
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    fileSize: stored.fileSize,
    storageKey: stored.storageKey,
    visibility: "postulant_visible",
    status: "available_to_postulant",
    uploadedById: new Types.ObjectId(actor.id),
    uploadedAt: new Date(),
  });

  // Deactivate previous active template with the same code if any
  await DocumentTemplateModel.updateMany(
    { code, isActive: true },
    { $set: { isActive: false } },
  );

  const template = await DocumentTemplateModel.create({
    code,
    title: input.title.trim(),
    phaseKey: input.phaseKey || "preliminary",
    documentType: input.documentType,
    fileDocumentId: doc._id,
    isActive: true,
    createdById: new Types.ObjectId(actor.id),
  });

  return {
    id: template._id.toString(),
    code: template.code,
    title: template.title,
    documentType: template.documentType,
    fileDocumentId: doc._id.toString(),
    isActive: template.isActive,
  };
};

export const listDocumentTemplates = async (
  filters: { documentType?: string; phaseKey?: string; isActive?: boolean },
  actor: Actor,
) => {
  if (actor.userType !== "internal") throw new HttpError(403, "Internal access required");

  const query: Record<string, unknown> = {};
  if (filters.documentType) query.documentType = filters.documentType;
  if (filters.phaseKey) query.phaseKey = filters.phaseKey;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;

  const templates = await DocumentTemplateModel.find(query).sort({ createdAt: -1 }).lean();

  return {
    items: templates.map((t) => ({
      id: t._id.toString(),
      code: t.code,
      title: t.title,
      documentType: t.documentType,
      phaseKey: t.phaseKey,
      fileDocumentId: t.fileDocumentId.toString(),
      isActive: t.isActive,
    })),
  };
};

export const getActivePreEvalTemplate = async (): Promise<{ fileDocumentId: Types.ObjectId }> => {
  const template = await DocumentTemplateModel.findOne({
    documentType: "pre_evaluation_blank_form",
    isActive: true,
  }).lean();

  if (!template) {
    throw new HttpError(
      422,
      "Aucun modèle de formulaire actif configuré. Configurez-en un dans les Paramètres → Modèles de documents.",
    );
  }

  return { fileDocumentId: template.fileDocumentId };
};

export const getActiveTemplatesByFormCodes = async (
  formCodes: string[],
): Promise<Map<string, { templateId: string; title: string; fileName: string }>> => {
  if (formCodes.length === 0) return new Map();

  const templates = await DocumentTemplateModel.find({
    code: { $in: formCodes },
    isActive: true,
  }).lean();

  const docIds = templates.map((t) => t.fileDocumentId);
  const docs = await DocumentModel.find({ _id: { $in: docIds } })
    .select("_id fileName")
    .lean();
  const docById = new Map(docs.map((d) => [d._id.toString(), String(d.fileName ?? "")]));

  const result = new Map<string, { templateId: string; title: string; fileName: string }>();
  for (const t of templates) {
    result.set(t.code, {
      templateId: t._id.toString(),
      title: t.title,
      fileName: docById.get(t.fileDocumentId.toString()) ?? "",
    });
  }
  return result;
};

export const downloadPortalFormalRequestTemplate = async (
  templateId: string,
  actor: { userType: string },
) => {
  if (actor.userType !== "postulant") throw new HttpError(403, "Portal access required");

  const objId = ensureObjectId(templateId, "Template ID");
  const template = await DocumentTemplateModel.findById(objId).lean();

  if (!template || !template.isActive) throw new HttpError(404, "Modèle introuvable");
  if (template.phaseKey !== "formal_request") {
    throw new HttpError(403, "Ce modèle n'est pas accessible via cette route");
  }

  const doc = await DocumentModel.findById(template.fileDocumentId).lean();
  if (!doc) throw new HttpError(404, "Fichier du modèle introuvable");

  const buffer = await storageAdapter.getBuffer(doc.storageKey as string);
  return { buffer, mimeType: doc.mimeType as string, fileName: doc.fileName as string };
};
