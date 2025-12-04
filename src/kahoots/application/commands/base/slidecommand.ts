import { KahootOptionCommand } from "./optioncommand";

// Interfaz que define la estructura del objeto de propiedades
interface SlideCommandProps {
    id?: string;
    // Propiedades que el Command requiere
    position: number;
    slideType: string;
    timeLimit: number;
    
    // Propiedades opcionales
    question?: string;
    slideImage?: string;
    points?: number;
    description?: string;
    options?: KahootOptionCommand[];
}

export class KahootSlideCommand {
    public readonly id?: string;

    public readonly position!: number;
    public readonly slideType!: string;
    public readonly timeLimit!: number;

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