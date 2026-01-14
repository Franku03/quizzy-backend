// Enum para Repositories
export enum RepositoryName {
  User = 'UserRepository',
  Kahoot = 'KahootRepository',
  Attempt = 'AttemptRepository',
  Group = 'GroupRepository',
  MultiplayerSession = 'MultiplayerSessionRepository',
  MassMessage = 'MassMessageRepository',
}

export const REPOSITORY_OVERRIDE_ENV_MAP: Record<RepositoryName, string> = {
  [RepositoryName.User]: 'DB_USER_REPO_TYPE',
  [RepositoryName.Kahoot]: 'DB_KAHOOT_REPO_TYPE',
  [RepositoryName.Attempt]: 'DB_ATTEMPT_REPO_TYPE',
  [RepositoryName.Group]: 'DB_GROUP_REPO_TYPE',
  [RepositoryName.MultiplayerSession]: 'DB_MULTIPLAYERSESSION_REPO_TYPE',
  [RepositoryName.MassMessage]: 'DB_MASS_MESSAGE_REPO_TYPE',
};
