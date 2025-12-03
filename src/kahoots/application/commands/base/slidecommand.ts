import { KahootOptionCommand } from "./optioncommand";

// Interfaz que define la estructura del objeto de propiedades
interface SlideCommandProps {
    // Propiedades que el Command requiere
    type: string;
    timeLimit: number;
    position: number;
    
    // Propiedades opcionales
    id?: string;
    question?: string;
    slideImage?: string;
    points?: number;
    description?: string;
    options?: KahootOptionCommand[];
}

export class KahootSlideCommand {
    public readonly type!: string;
    public readonly timeLimit!: number;
    public readonly position!: number;
    
    public readonly id?: string;
    public readonly question?: string;
    public readonly slideImage?: string;
    public readonly points?: number;
    public readonly description?: string;
    public readonly options?: KahootOptionCommand[];

    constructor(props: SlideCommandProps) {
        // Asigna todas las propiedades del objeto de configuración a la instancia
        Object.assign(this, props);
    }
}