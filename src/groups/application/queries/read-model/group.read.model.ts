export class GroupReadModel {

    constructor(public readonly id: string, public readonly name: string, public readonly role: string, public readonly memberCount: number, public readonly createdAt: Date) {
    }
}