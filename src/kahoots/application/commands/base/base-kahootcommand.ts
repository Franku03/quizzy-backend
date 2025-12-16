import { KahootSlideCommand } from "./slidecommand";
import { ICommand } from 'src/core/application/cqrs/command.interface';

// Interfaz que define la estructura del objeto de propiedades
interface BaseCommandProps {
    title?: string;
    description?: string;
    imageId?: string;
    themeId: string;
    category?: string;
    visibility: string;
    status: string;
    slides?: KahootSlideCommand[];
    userId: string;
}

export class BaseKahootCommand implements ICommand {
    public readonly title?: string;
    public readonly userId: string;
    public readonly description?: string;
    public readonly imageId?: string;
    public readonly themeId: string;
    public readonly category?: string;
    public readonly visibility: string;
    public readonly status: string;
    public readonly slides?: KahootSlideCommand[];

    constructor(props: BaseCommandProps) {
        Object.assign(this, props);
    }
}