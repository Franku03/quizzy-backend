// --- Domain Models & Snapshots ---
import { ImageId } from '../../../core/domain/shared-value-objects/id-objects/image.id';
import { ThemeId } from './kahoot.theme';
// Importamos la CLASE
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.stiyling";

// --- Core & Externals ---
import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

interface KahootStylingProps {
    readonly imageId: Optional<ImageId>;
    readonly themeId: ThemeId;
}

export class KahootStyling extends ValueObject<KahootStylingProps> {
    
    public constructor(imageId: Optional<ImageId>, themeId: ThemeId) {
        super({ imageId, themeId });
    }

    public static create(
        imageId: Optional<ImageId>, 
        themeId: ThemeId
    ): Either<ErrorData, KahootStyling> {
        const context = createDomainContext('KahootStyling', 'validateStyling', {
            domainObjectKind: 'ValueObject'
        });

        if (!themeId) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { themeId: ['REQUIRED'] },
                "Kahoot theme is mandatory."
            ));
        }

        return Either.makeRight(new KahootStyling(imageId, themeId));
    }
    
    public get imageId(): Optional<ImageId> { return this.properties.imageId; }
    public get themeId(): ThemeId { return this.properties.themeId; }
    public get themeName(): string { return this.properties.themeId.value; }

    public getSnapshot(): KahootStylingSnapshot {
        return KahootStylingSnapshot.fromRaw({
            imageId: this.imageId.hasValue() 
                ? this.imageId.getValue().value 
                : undefined,
            themeId: this.themeId.value,
        });
    }
}