import { ValueObject } from "src/core/domain/value.object";
import { Optional } from "src/core/types/optional";

const UUID_V4_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

interface KahootStylingProps {
    readonly imageId: Optional<string>;
    readonly themeName: string;
}

export class KahootStyling extends ValueObject<KahootStylingProps> {
    
    public constructor(
        imageId: Optional<string>, 
        rawThemeName: string
    ) {
        const themeName = rawThemeName?.trim() || "";
        
        if (themeName.length === 0) {
            throw new Error("El tema no puede estar vacío.");
        }
        if (imageId.hasValue()) {
            const uuid = imageId.getValue();
            if (!UUID_V4_REGEX.test(uuid)) {
                throw new Error(`La identidad de imagen (${uuid}) no es un formato UUID V4 válido.`);
            }
        }
        super({ imageId, themeName });
    }
    
    public get imageId(): Optional<string> {
        return this.properties.imageId;
    }

    public get themeName(): string {
        return this.properties.themeName;
    }
}