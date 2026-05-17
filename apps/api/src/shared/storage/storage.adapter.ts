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
  delete(storageKey: string): Promise<void>;
}

export class LocalStoragePlaceholderAdapter implements StorageAdapter {
  async save(): Promise<StoredFileMetadata> {
    throw new Error("Local file storage adapter is not implemented yet");
  }

  async getReadUrl(): Promise<string> {
    throw new Error("Local file storage adapter is not implemented yet");
  }

  async delete(): Promise<void> {
    throw new Error("Local file storage adapter is not implemented yet");
  }
}

export const storageAdapter: StorageAdapter = new LocalStoragePlaceholderAdapter();
