import { Either } from "src/core/types/either";
import { CloudinaryError } from "src/media/infraestructure/adapters/errors";

export interface IAssetStorageService {
    uploadAndDeduplicate(fileBuffer: Buffer, hash: string): Promise<Either<CloudinaryError, string>>;
    generateUrl(publicId: string): string;
    deleteAsset(publicId: string): Promise<Either<CloudinaryError, void>>;
}