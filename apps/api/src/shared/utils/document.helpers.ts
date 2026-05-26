import { Types } from "mongoose";

import { storageAdapter } from "../storage/storage.adapter.js";
import { DocumentModel } from "../../modules/documents/document.model.js";

export const saveDocument = async (params: {
  file: Express.Multer.File;
  ownerPath: string;
  ownerType: string;
  ownerId: Types.ObjectId;
  category: string;
  documentType: string;
  title: string;
  visibility: string;
  status: string;
  uploadedById: Types.ObjectId;
}): Promise<Types.ObjectId> => {
  const stored = await storageAdapter.save({
    buffer: params.file.buffer,
    fileName: params.file.originalname,
    mimeType: params.file.mimetype,
    ownerPath: params.ownerPath,
  });

  const doc = (await DocumentModel.create({
    ownerType: params.ownerType,
    ownerId: params.ownerId,
    category: params.category,
    documentType: params.documentType,
    title: params.title,
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    fileSize: stored.fileSize,
    storageKey: stored.storageKey,
    visibility: params.visibility,
    status: params.status,
    uploadedById: params.uploadedById,
    uploadedAt: new Date(),
  })) as unknown as { _id: Types.ObjectId } & Record<string, unknown>;

  return doc._id;
};
