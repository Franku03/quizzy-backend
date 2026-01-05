import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { DbPostgresEntity } from '../decorators/db-postgres-entity.decorator';

const ENTITY_NAME = 'kahoot';

@DbPostgresEntity(ENTITY_NAME)
@Entity('Kahoot')
export class KahootEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
