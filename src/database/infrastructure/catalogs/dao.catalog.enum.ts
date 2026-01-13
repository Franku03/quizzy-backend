/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\catalogs\dao.catalog.enum.ts

// Enum para DAOs
export enum DaoName {
  User = 'UserDao',
  Library = 'LibraryDao',
  Group = 'GroupDao',
  Kahoot = 'KahootDao',
  SoloAttempt = 'SoloAttemptDao',
  Explore = 'ExploreDao',
  AssetMetadata = 'AssetMetadataDao',
  MultiplayerSession = 'MultiplayerSession',
}

export const DAO_OVERRIDE_ENV_MAP: Record<DaoName, string> = {
  [DaoName.User]: 'DB_USER_DAO_TYPE',
  [DaoName.Library]: 'DB_LIBRARY_DAO_TYPE',
  [DaoName.Group]: 'DB_GROUP_DAO_TYPE',
  [DaoName.Kahoot]: 'DB_KAHOOT_DAO_TYPE',
  [DaoName.SoloAttempt]: 'DB_SOLOATTEMPT_DAO_TYPE',
  [DaoName.Explore]: 'DB_EXPLORE_DAO_TYPE',
  [DaoName.AssetMetadata]: 'DB_ASSETMETADATA_DAO_TYPE',
  [DaoName.MultiplayerSession]: 'DB_MULTIPLAYERSESSION_DAO_TYPE',

};
