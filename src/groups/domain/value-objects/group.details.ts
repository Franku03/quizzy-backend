import { ValueObject } from "src/core/domain/abstractions/value.object";

interface GroupDetailsProps {
    readonly name: string;
    readonly description: string;
}

export class GroupDetails extends ValueObject<GroupDetailsProps> {
    private constructor(private readonly name: string, private readonly description: string) {
        if (name.length < 3 || name.length > 20) {
            throw new Error("El nombre del grupo debe tener entre 3 y 20 caracteres.");
        }
        if (description.length > 200) {
            throw new Error("La descripción del grupo debe tener menos de 200 caracteres.");
        }
        super({ name, description });
    }

    public static create(name?: string, description?: string): GroupDetails {
        const desc = description || '';
        const n = name || '';
        return new GroupDetails(n, desc);
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    setName(name: string): GroupDetails {
        return GroupDetails.create(name, this.description);
    }

    setDescription(description: string): GroupDetails {
        return GroupDetails.create(this.name, description);
    }
}