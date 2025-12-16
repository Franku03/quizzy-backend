// src/media/application/commands/upload-asset/upload-asset.command.ts
import { ICommand } from 'src/core/application/cqrs/command.interface';

export class UploadAssetCommand implements ICommand {
  constructor(
    public readonly fileBuffer: Buffer,
    public readonly mimeType: string,
    public readonly originalName: string
  ) {}
}