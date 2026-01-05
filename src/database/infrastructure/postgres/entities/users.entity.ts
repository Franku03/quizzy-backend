import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { DbPostgresEntity } from '../decorators/db-postgres-entity.decorator';

const ENTITY_NAME = 'user';

@DbPostgresEntity(ENTITY_NAME)
@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
