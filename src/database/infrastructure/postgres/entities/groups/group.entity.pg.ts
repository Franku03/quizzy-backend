import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { DbPostgresEntity } from '../../registries/db-model-postgres.registry';

const ENTITY_NAME = 'groups';

interface MemberSchema {
    id: string;
    userId: string;
    role: string;
    joinedAt: Date;
}

interface AssignmentSchema {
    id: string;
    quizId: string;
    assignedBy: string;
    availableFrom: Date;
    availableUntil: Date;
    isAssignmentCompleted: boolean;
}

interface CompletionSchema {
    userId: string;
    quizId: string;
    attemptId: string;
    score: number;
}

interface TokenSchema {
    value: string;
    expiresAt: Date;
}

@DbPostgresEntity(ENTITY_NAME)
@Entity('groups')
export class GroupEntity {
    @PrimaryColumn('uuid', { name: 'group_id' })
    @Index({ unique: true })
    groupId: string;

    @Column('uuid', { name: 'admin_id' })
    @Index()
    adminId: string;

    @Column()
    @Index()
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @Column({
        type: 'jsonb',
        default: [],
    })
    members: MemberSchema[];

    @Column({
        type: 'jsonb',
        default: [],
    })
    assignments: AssignmentSchema[];

    @Column({
        type: 'jsonb',
        default: [],
    })
    completions: CompletionSchema[];

    @Column({
        type: 'jsonb',
        nullable: true,
    })
    invitationToken?: TokenSchema;
}
