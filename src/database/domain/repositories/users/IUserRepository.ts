export interface IUserRepository {
  saveUser(name: string): Promise<void>;
}
