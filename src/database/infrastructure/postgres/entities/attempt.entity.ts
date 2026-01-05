import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { DbPostgresEntity } from '../registries/db-model-postgres.registry';

const ENTITY_NAME = 'attempt';

@DbPostgresEntity(ENTITY_NAME)
@Entity('Attempt')
export class AttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
