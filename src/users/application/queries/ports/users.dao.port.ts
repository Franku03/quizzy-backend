import { Optional } from 'src/core/types/optional';
import { UserReadModel } from '../read-model/user.read.model';

export interface IUserDao {
  getUserByName(name: string): Promise<Optional<UserReadModel>>;
  getUserById(id: string): Promise<Optional<UserReadModel>>;
}