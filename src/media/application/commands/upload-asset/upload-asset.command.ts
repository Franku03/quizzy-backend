export class UploadAssetCommand {

    public readonly fileBuffer: Buffer;
    public readonly mimeType: string;

    constructor(fileBuffer: Buffer, mimeType: string) {
        this.fileBuffer = fileBuffer;
        this.mimeType = mimeType;
    }
}