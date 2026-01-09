// Enum para DAOs
export enum DaoName {
  User = 'UserDao',
  Library = 'LibraryDao',
  Group = 'GroupDao',
  Kahoot = 'KahootDao',
  SoloAttempt = 'SoloAttemptDao',
  Explore = 'ExploreDao',
  AssetMetadata = 'AssetMetadataDao',
}

export const DAO_OVERRIDE_ENV_MAP: Record<DaoName, string> = {
  [DaoName.User]: 'DB_USER_DAO_TYPE',
  [DaoName.Library]: 'DB_LIBRARY_DAO_TYPE',
  [DaoName.Group]: 'DB_GROUP_DAO_TYPE',
  [DaoName.Kahoot]: 'DB_KAHOOT_DAO_TYPE',
  [DaoName.SoloAttempt]: 'DB_SOLOATTEMPT_DAO_TYPE',
  [DaoName.Explore]: 'DB_EXPLORE_DAO_TYPE',
  [DaoName.AssetMetadata]: 'DB_ASSETMETADATA_DAO_TYPE',
};
