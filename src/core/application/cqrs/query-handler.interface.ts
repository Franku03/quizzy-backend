/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\cqrs\query-handler.interface.ts

import { IQuery } from './query.interface';

export interface IQueryHandler<TQuery extends IQuery = IQuery> {
  execute(query: TQuery): Promise<any>;
}
