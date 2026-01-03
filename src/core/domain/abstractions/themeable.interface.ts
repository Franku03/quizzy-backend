// src/core/domain/abstractions/themeable.interface.ts
import { ThemeObject } from "src/core/types/theme.object";

export interface IThemeable {
  themeId: string;
  theme?: ThemeObject;
}