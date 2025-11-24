export interface IKahootRepository {
  saveKahoot(name: string): Promise<void>;
}
