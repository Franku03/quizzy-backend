/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\domain\value-objects\user.user-preferences.ts

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
        const matchedTheme = Object.values(UIThemeEnum).find(t => t === theme);

        if (!matchedTheme) {
            throw new InvalidArgumentError(`The theme <${theme}> is invalid. Options: ${Object.values(UIThemeEnum).join(', ')}`);
        }
        return new UserPreferences(matchedTheme);
    }

    get themePreference(): UIThemeEnum {
        return this.properties.themePreference;
    }
}