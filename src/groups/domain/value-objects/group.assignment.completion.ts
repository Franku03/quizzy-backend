import { ValueObject } from "src/core/domain/abstractions/value.object";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";

//pending
//import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id"; // Crear este VO
//import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/attempt.id"; // Crear este VO


interface UserId {
    readonly value: string;
}

interface AttemptId {
    readonly value: string;
}

interface GroupAssignmentCompletionProps {
    readonly userId: UserId;
    readonly quizId: KahootId;
    readonly attemptId: AttemptId;
    readonly score: Score;
}

export class GroupAssignmentCompletion extends ValueObject<GroupAssignmentCompletionProps> {
    
    protected constructor(props: GroupAssignmentCompletionProps) {
        if (!props.userId) {
            throw new Error("El userId es requerido.");
        }
        if (!props.quizId) {
            throw new Error("El quizId es requerido.");
        }
        if (!props.attemptId) {
            throw new Error("El attemptId es requerido.");
        }
        if (!props.score) {
            throw new Error("El score es requerido.");
        }
        super(props);
    }

    public static create(
        userId: UserId,
        quizId: KahootId,
        attemptId: AttemptId,
        score: Score
    ): GroupAssignmentCompletion {
        return new GroupAssignmentCompletion({ userId, quizId, attemptId, score });
    }

    public getUserId(): UserId { return this.properties.userId; }
    public getQuizId(): KahootId { return this.properties.quizId; }
    public getAttemptId(): AttemptId { return this.properties.attemptId; }
    public getScore(): Score { return this.properties.score; }
}