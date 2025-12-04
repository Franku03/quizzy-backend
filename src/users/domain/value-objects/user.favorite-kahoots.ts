import { ValueObject } from "src/core/domain/abstractions/value.object";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";

interface UserFavoritesProps {
    ids: Set<string>;
}

export class UserFavorites extends ValueObject<UserFavoritesProps> {
    
    private constructor(ids: Set<string>) {
        super({ ids });
    }

    public static createEmpty(): UserFavorites {
        return new UserFavorites(new Set());
    }

    public static fromPrimitives(ids: string[]): UserFavorites {
        return new UserFavorites(new Set(ids));
    }

    public add(id: KahootId): void {
        this.properties.ids.add(id.value);
    }

    public remove(id: KahootId): void {
        this.properties.ids.delete(id.value);
    }

    public has(id: KahootId): boolean {
        return this.properties.ids.has(id.value);
    }

    public get count(): number {
        return this.properties.ids.size;
    }
    
    public toPrimitives(): string[] {
        return Array.from(this.properties.ids);
    }
    
    public get kahootsIds(): KahootId[] {
        return this.toPrimitives().map(id => new KahootId(id));
    }
}