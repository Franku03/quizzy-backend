import { Group } from "src/groups/domain/aggregates/group"; // Asegúrate que Group exista o usa any si falla

export interface IGroupRepository {
    save(group: any): Promise<void>;
    findByMemberAndKahoot(userId: string, kahootId: string): Promise<any[]>;
    // Agrega cualquier otro método que te pida el compilador si sale error,
    // pero con estos dos debería bastar por lo que vi en tus mensajes anteriores.
}