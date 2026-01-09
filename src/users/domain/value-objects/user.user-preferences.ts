import { ValueObject } from "src/core/domain/abstractions/value.object";
import { InvalidArgumentError } from "../errors/invalid.argument.error";

export enum UIThemeEnum {
    DARK = "DARK",
    LIGHT = "LIGHT",
}

interface UserPreferencesProps {
    readonly themePreference: UIThemeEnum;
}

export class UserPreferences extends ValueObject<UserPreferencesProps> {

    private constructor(themePreference: UIThemeEnum) {
        super({ themePreference });
    }

    public static create(theme: string): UserPreferences {
        const matchedTheme = Object.values(UIThemeEnum).find(theme => theme === theme);

        if (!matchedTheme) {
            throw new InvalidArgumentError(`The theme <${theme}> is invalid. Options: ${Object.values(UIThemeEnum).join(', ')}`);
        }
        return new UserPreferences(matchedTheme);
    }

    get themePreference(): UIThemeEnum {
        return this.properties.themePreference;
    }
}