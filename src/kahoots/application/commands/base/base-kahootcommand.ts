import { KahootSlideCommand } from "./slidecommand";

// Interfaz que define la estructura del objeto de propiedades
interface BaseCommandProps {
    title?: string;
    description?: string;
    coverImageId?: string;
    themeId?: string;
    category?: string;
    visibility?: string;
    status?: string;
    slides?: KahootSlideCommand[];
}

export class BaseKahootCommand {
    public readonly title?: string;
    public readonly description?: string;
    public readonly coverImageId?: string;
    public readonly themeId?: string;
    public readonly category?: string;
    public readonly visibility?: string;
    public readonly status?: string;
    public readonly slides?: KahootSlideCommand[];

    constructor(props: BaseCommandProps) {
        Object.assign(this, props);
    }
}