/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\queries\ports\users.dao.port.ts

import { Optional } from 'src/core/types/optional';
import { UserReadModel } from '../read-model/user.read.model';

export interface IUserDao {
  getUserByName(name: string): Promise<Optional<UserReadModel>>;
  getUserById(id: string): Promise<Optional<UserReadModel>>;
}