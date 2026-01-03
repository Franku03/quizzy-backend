import { ThemeObject } from "src/core/types/theme.object";

export interface KahootStylingSnapshot {
    themeId: string;
    imageId?: string ; 
    theme?: ThemeObject;
}