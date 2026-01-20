/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\adapters-postgres.imports.ts

// El proposito tras este archivo es exportar todos los daos y repositories
// para que los decoraddores DaoPostgres y RepositoryPostgres se ejcuten e hidraten
// el registry de daos y repositories de Postgres

import './explore';
import './groups';
import './kahoots';
import './library';
import './media';
import './multiplayer-session';
import './notifications';
import './solo-attempts';
import './users';
import './backoffice';
