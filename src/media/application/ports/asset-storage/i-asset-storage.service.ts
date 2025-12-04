
export interface IAssetStorageService {

    uploadAndDeduplicate(fileBuffer: Buffer, hash: string): Promise<string>;
    generateUrl(publicId: string): string;
    deleteAsset(publicId: string): Promise<void>;
}