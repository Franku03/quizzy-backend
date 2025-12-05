export interface AssignKahootToGroupResponse {
    readonly groupId: string;
    readonly quizId: string;
    readonly assignedBy: string;
    readonly availableFrom: Date;
    readonly availableTo: Date;
}