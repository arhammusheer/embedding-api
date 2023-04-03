import { Storage, Bucket, File } from "@google-cloud/storage";

export default class StorageService {
  private storage: Storage;
  private bucket: Bucket;

  constructor(bucketName: string) {
    this.storage = new Storage();
    this.bucket = this.storage.bucket(bucketName);
  }

  // Upload a file to the bucket
  public async uploadFile(
    filename: string,
    file: Buffer,
    metadata: { [key: string]: string }
  ): Promise<string> {
    const fileObject = this.bucket.file(filename);
    await fileObject.save(file, { metadata });
    return fileObject.publicUrl();
  }

  // Delete a file from the bucket
  public async deleteFile(filename: string): Promise<void> {
    const file = this.bucket.file(filename);
    await file.delete();
  }

  // Get a file from the bucket
  public async getFile(filename: string): Promise<File> {
    const file = this.bucket.file(filename);
    return file;
  }

  // Check if a file exists in the bucket
  public async fileExists(filename: string): Promise<boolean> {
    const file = this.bucket.file(filename);
    const exists = await file.exists();
    return exists[0];
  }
}
