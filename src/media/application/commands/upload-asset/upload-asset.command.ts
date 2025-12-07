// src/media/application/commands/upload-asset/upload-asset.command.ts
export class UploadAssetCommand {
  constructor(
    public readonly fileBuffer: Buffer,
    public readonly mimeType: string,
    public readonly originalName: string
  ) {}
}