export interface JoinGroupResponse {
    readonly groupId: string;
    readonly groupName: string;
    readonly joinedAt: Date;
    readonly role: string;
}