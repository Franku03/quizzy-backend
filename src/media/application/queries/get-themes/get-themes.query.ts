/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\queries\get-themes\get-themes.query.ts

import { IQuery } from 'src/core/application/cqrs/query.interface';

export interface GetThemesProps {
  category?: string;
  format?: string;
  mimeType?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'uploadedAt' | 'size' | 'originalName';
  sortOrder?: 'asc' | 'desc';
}

export class GetThemesQuery implements IQuery {
  public readonly category?: string;
  public readonly format?: string;
  public readonly mimeType?: string;
  public readonly limit?: number;
  public readonly offset?: number;
  public readonly sortBy?: 'uploadedAt' | 'size' | 'originalName';
  public readonly sortOrder?: 'asc' | 'desc';

  constructor(props: GetThemesProps) {
    Object.assign(this, props);
  }
}