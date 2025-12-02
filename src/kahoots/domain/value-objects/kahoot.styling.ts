import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";
import { ImageId } from '../../../core/domain/shared-value-objects/id-objects/image.id';
import { ThemeId } from './kahoot.theme';
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.-stiyling";

interface KahootStylingProps {
    readonly imageId: Optional<ImageId>;
    readonly themeId: ThemeId;
}

export class KahootStyling extends ValueObject<KahootStylingProps> {
    
    public constructor(
        imageId: Optional<ImageId>, 
        themeId: ThemeId
    ) {
        if (!themeId) {
            throw new Error("El tema no puede estar vacío.");
        }
        super({ imageId,  themeId });
    }
    
    public get imageId(): Optional<ImageId> {return this.properties.imageId;}
    public get themeName(): string {return this.properties.themeId.value;}

    public getSnapshot(): KahootStylingSnapshot {
    return {
        imageId: this.properties.imageId.hasValue() ? this.properties.imageId.getValue().value : null,
        themeId: this.properties.themeId.value,
    };
}
}