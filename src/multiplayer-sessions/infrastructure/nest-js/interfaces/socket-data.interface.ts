import { SessionRoles } from "../enums/session-roles.enum";

export interface SocketData {
    
    nickname: string,
    roomPin: string
    role: SessionRoles,
    // userId: string,
}