export interface TransferAdminResponse {
    readonly groupId: string;
    readonly previousAdmin: {
        readonly userId: string,
        readonly role: string
    },
    readonly newAdmin: {
        readonly userId: string,
        readonly role: string
    },
    readonly transferredAt: Date;
}