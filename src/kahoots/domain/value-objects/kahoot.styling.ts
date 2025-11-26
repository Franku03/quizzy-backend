import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";
import { ImageId } from '../../../core/domain/shared-value-objects/id-objects/image.id';

interface KahootStylingProps {
    readonly imageId: Optional<ImageId>;
    readonly themeName: string;
}

export class KahootStyling extends ValueObject<KahootStylingProps> {
    
    public constructor(
        imageId: Optional<ImageId>, 
        rawThemeName: string
    ) {
        const themeName = rawThemeName?.trim() || "";
        
        if (themeName.length === 0) {
            throw new Error("El tema no puede estar vacío.");
        }
        super({ imageId, themeName });
    }
    
    public get imageId(): Optional<ImageId> {return this.properties.imageId;}
    public get themeName(): string {return this.properties.themeName;}
}