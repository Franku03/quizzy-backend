//src/media/application/ports/i-theme-enrichable.interface.ts
import { ThemeObject } from "src/core/types/theme.object";

export interface IThemeEnrichable {

  themeId?: string;
  theme?: ThemeObject;
}