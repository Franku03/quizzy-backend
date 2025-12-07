import { BaseKahootCommand } from "../base/base-kahootcommand";
import { KahootSlideCommand } from "../base/slidecommand";

// Interfaz que define las propiedades que el Command puede aceptar
interface UpdateCommandProps {
    userId: string;
    id: string;
    title?: string;
    description?: string;
    imageId?: string;
    themeId: string;
    category?: string;
    visibility: string;
    status: string;
    slides?: KahootSlideCommand[];
    
    createdAt?: Date;
    playCount?: number;
    authorId?: string;
}

export class UpdateKahootCommand extends BaseKahootCommand {
    public readonly id: string; 
    public declare readonly authorId?: string; // ⚠️ LEGACY
    public declare readonly createdAt?: Date; // ⚠️ LEGACY
    public declare readonly playCount?: number; // ⚠️ LEGACY
    constructor(props: UpdateCommandProps) {
        super(props); 
        Object.assign(this, props);
    }
}