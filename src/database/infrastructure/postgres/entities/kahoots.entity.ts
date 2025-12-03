import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Kahoot')
export class KahootEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
