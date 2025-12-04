import { BaseKahootCommand } from "../base/base-kahootcommand";
import { KahootSlideCommand } from "../base/slidecommand";

interface CreateCommandProps {
    authorId: string;
    themeId: string;
    visibility: string;
    status: string;
    title?: string;
    description?: string;
    imageId?: string;
    category?: string;
    slides?: KahootSlideCommand[];
}

export class CreateKahootCommand extends BaseKahootCommand {
    // Usamos 'declare' para indicar que estas propiedades se definen en el padre (BaseKahootCommand)
    // y solo estamos sobrescribiendo su tipado de opcional (?) a obligatorio (!:)
    public declare readonly authorId: string;
    public declare readonly themeId: string;
    public declare readonly visibility: string;
    public declare readonly status: string;

    constructor(props: CreateCommandProps) {
        super(props); 
    }
}