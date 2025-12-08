// src/media/domain/helpers/mime-type.helper.ts
export class MimeTypeHelper {
  static getFormat(mimeType: string): string {
    // image/jpeg -> jpeg
    // application/pdf -> pdf
    return mimeType.split('/')[1] || 'unknown';
  }

  static getCategory(mimeType: string): string {
    const [type] = mimeType.split('/');
    
    const categories = {
      'image': 'image',
      'video': 'video',
      'audio': 'audio',
      'application': 'document',
      'text': 'document',
      'font': 'document'
    };
    
    return categories[type] || 'other';
  }

  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }
}