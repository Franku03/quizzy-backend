import { Injectable, Inject } from "@nestjs/common";
import { Either, ErrorData } from "src/core/types";
import { ThemeObject } from "src/core/types/theme.object";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IThemeEnricher } from "../ports/i-theme-enricher.interface";

@Injectable()
export class ThemeResolutionProxy implements IThemeEnricher {
    // Aquí vive la "memoria" (Flyweight)
    private readonly themeCache = new Map<string, ThemeObject>();

    constructor(
        @Inject(MEDIA_TOKENS.RAW_THEME_ENRICHER) // Inyectamos el Service de arriba
        private readonly decoratee: IThemeEnricher
    ) { }

    async enrichTheme(assetId: string): Promise<Either<ErrorData, ThemeObject | null>> {
        if (!assetId) return Either.makeRight(null);

        // 1. HIT: Si ya lo tengo en RAM, lo devuelvo (Flyweight)
        const cached = this.themeCache.get(assetId);
        if (cached) return Either.makeRight(cached);

        // 2. MISS: Si no, llamo al Service real
        const result = await this.decoratee.enrichTheme(assetId);

        // 3. Persistimos en la memoria del Proxy para la próxima vez
        return result.map(theme => {
            if (theme) this.themeCache.set(assetId, theme);
            return theme;
        });
    }
}

