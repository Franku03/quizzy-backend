import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../constants/kahoot.rules";
import { KahootDetailsSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.details";



interface KahootDetailsProps {
    readonly title: Optional<string>;
    readonly description: Optional<string>;
    readonly category: Optional<string>;
}

export class KahootDetails extends ValueObject<KahootDetailsProps> {
    
    public constructor(
        title: Optional<string>, 
        description: Optional<string>, 
        category: Optional<string>
    ) {
        if(!title.hasValue() && !description.hasValue() && !category.hasValue()) {
             throw new Error(`Debe tener titulo, descripcion o categoria.`);
        }
        if (title.hasValue()) {
            const currentTitle = title.getValue(); 
            if (currentTitle.length > MAX_TITLE_LENGTH) {
                throw new Error(`El título no puede exceder los ${MAX_TITLE_LENGTH} caracteres.`);
            }
        }
        if (description.hasValue()) {
            const currentDesc = description.getValue();
            if (currentDesc.length > MAX_DESCRIPTION_LENGTH) {
                throw new Error(`La descripción no puede exceder los ${MAX_DESCRIPTION_LENGTH} caracteres.`);
            }
        }
        super({ title, description, category });
    }

    public isValidDetails() {
        if(!this.properties.title.hasValue() && !this.properties.description.hasValue())
            throw new Error("Kahoot Debe tener titulo y descipcion para ser publicado")

    }
    
    public get title(): Optional<string> { return this.properties.title; }
    public get description(): Optional<string> { return this.properties.description; }
    public get category(): Optional<string> { return this.properties.category; }


    public getSnapshot(): KahootDetailsSnapshot {
        return {
            title: this.properties.title.hasValue() ? this.properties.title.getValue() : undefined,
            description: this.properties.description.hasValue() ? this.properties.description.getValue() : undefined,
            category: this.properties.category.hasValue() ? this.properties.category.getValue() : undefined,
        };
    }
}