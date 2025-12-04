export interface FileMetadataSnapshot {
    publicId: string; 
    contentHash: string; 
    mimeType: string;
    referenceCount: number; 
    createdAt: string; 
}