/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\ports\i-url-configurable.interface.ts

import { IHasMediaAssets } from 'src/core/domain/abstractions/media.assets.interface';
import { BaseEnrichmentHandler } from '../handlers/base-enrichment.handler';

export interface IUrlConfigurable<
  T extends IHasMediaAssets,
> extends BaseEnrichmentHandler<T> {
  setContext(urlMap: Map<string, string>): this;
}
