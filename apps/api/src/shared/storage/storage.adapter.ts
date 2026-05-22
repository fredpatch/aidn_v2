import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize, resolve, sep } from "node:path";

import { env } from "../config/env.js";

export interface StoredFileMetadata {
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface StorageAdapter {
  save(input: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    ownerPath: string;
  }): Promise<StoredFileMetadata>;
  getReadUrl(storageKey: string): Promise<string>;
  getBuffer(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

export class LocalStoragePlaceholderAdapter implements StorageAdapter {
  private readonly storageRoot = resolve(process.cwd(), env.uploadStorageDir);

  async save(input: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    ownerPath: string;
  }): Promise<StoredFileMetadata> {
    const safeOwnerPath = input.ownerPath
      .split(/[\\/]+/)
      .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ""))
      .filter(Boolean)
      .join(sep);
    const extension = extname(input.fileName).toLowerCase();
    const safeFileName = `${randomUUID()}${extension}`;
    const storageKey = normalize(join(safeOwnerPath, safeFileName));
    const absolutePath = resolve(this.storageRoot, storageKey);

    if (!absolutePath.startsWith(`${this.storageRoot}${sep}`)) {
      throw new Error("Invalid storage path");
    }

    await mkdir(resolve(absolutePath, ".."), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      storageKey,
      fileName: basename(input.fileName),
      mimeType: input.mimeType,
      fileSize: input.buffer.length,
    };
  }

  async getReadUrl(storageKey: string): Promise<string> {
    return `local://${storageKey}`;
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    const absolutePath = resolve(this.storageRoot, storageKey);

    if (!absolutePath.startsWith(`${this.storageRoot}${sep}`)) {
      throw new Error("Invalid storage path");
    }

    return readFile(absolutePath);
  }

  async delete(storageKey: string): Promise<void> {
    const absolutePath = resolve(this.storageRoot, storageKey);

    if (!absolutePath.startsWith(`${this.storageRoot}${sep}`)) {
      throw new Error("Invalid storage path");
    }

    await rm(absolutePath, { force: true });
  }
}

export const storageAdapter: StorageAdapter = new LocalStoragePlaceholderAdapter();
