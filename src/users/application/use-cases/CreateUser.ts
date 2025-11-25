import type { IUserRepository } from 'src/database/domain/repositories/users/IUserRepository';

export class CreateUser {
  constructor(private readonly userRespository: IUserRepository) {}

  async execute(name: string): Promise<void> {
    await this.userRespository.saveUser(name);
  }
}
