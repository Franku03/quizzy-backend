import { BaseKahootCommand } from "../base/base-kahootcommand";
import { KahootSlideCommand } from "../base/slidecommand";

// Interfaz que define las propiedades que el Command puede aceptar
interface UpdateCommandProps {
    id: string; // Requerido para la operación de actualización
    
    // Propiedades opcionales (heredadas)
    title?: string;
    description?: string;
    coverImageId?: string;
    themeId: string;
    category?: string;
    visibility?: string;
    status?: string;
    slides?: KahootSlideCommand[];
    
    // Propiedades específicas opcionales
    authorId?: string;
    createdAt?: Date;
    playCount?: number;
}

export class UpdateKahootCommand extends BaseKahootCommand {
    // Definimos 'id' como obligatorio en el contexto de esta clase
    public readonly id!: string; 
    
    // Usamos 'declare' para propiedades heredadas que son opcionales en la base 
    public declare readonly authorId?: string;
    public declare readonly createdAt?: Date;
    public declare readonly playCount?: number;
    // Las propiedades 'title', 'description', etc., se asignan desde el constructor del padre.

    constructor(props: UpdateCommandProps) {
        // Llama al constructor del padre pasándole el objeto de propiedades completo.
        super(props); 
        
        // Asigna todas las propiedades (incluyendo 'id') a la instancia (DRY)
        Object.assign(this, props);
    }
}