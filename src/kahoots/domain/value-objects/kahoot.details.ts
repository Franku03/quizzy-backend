import { ValueObject } from "src/core/domain/value.object";
import { Optional } from "src/core/types/optional";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../constants/kahoot.rules";



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
    public get title(): Optional<string> { return this.properties.title; }
    public get description(): Optional<string> { return this.properties.description; }
    public get category(): Optional<string> { return this.properties.category; }
}