/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\catalogs\repository.catalog.enum.ts

// Enum para Repositories
export enum RepositoryName {
  User = 'UserRepository',
  Kahoot = 'KahootRepository',
  Attempt = 'AttemptRepository',
  Group = 'GroupRepository',
  MultiplayerSession = 'MultiplayerSessionRepository',
}

export const REPOSITORY_OVERRIDE_ENV_MAP: Record<RepositoryName, string> = {
  [RepositoryName.User]: 'DB_USER_REPO_TYPE',
  [RepositoryName.Kahoot]: 'DB_KAHOOT_REPO_TYPE',
  [RepositoryName.Attempt]: 'DB_ATTEMPT_REPO_TYPE',
  [RepositoryName.Group]: 'DB_GROUP_REPO_TYPE',
  [RepositoryName.MultiplayerSession]: 'DB_MULTIPLAYERSESSION_REPO_TYPE',
};
