/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\helpers\mime-type.helper.ts

export class MimeTypeHelper {
  static getFormat(mimeType: string): string {
    // image/jpeg -> jpeg
    // application/pdf -> pdf
    return mimeType.split('/')[1] || 'unknown';
  }

  static getCategory(mimeType: string): string {
    const [type] = mimeType.split('/');

    const categories: Record<string, string> = {
      image: 'image',
      video: 'video',
      audio: 'audio',
      application: 'document',
      text: 'document',
      font: 'document',
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
