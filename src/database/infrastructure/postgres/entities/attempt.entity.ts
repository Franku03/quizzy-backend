import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Attempt')
export class AttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
