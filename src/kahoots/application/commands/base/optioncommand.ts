interface OptionCommandProps {
    // text: Mapeado de text. Aunque puede ser "", el Command lo requiere.
    text: string;
    // isCorrect: Obligatorio y siempre debe ser un booleano.
    isCorrect: boolean;
    // optionImage: Opcional, ya purgado a undefined.
    optionImage?: string;
}

export class KahootOptionCommand {
    public readonly text: string;
    public readonly isCorrect: boolean;
    public readonly optionImage?: string;

    constructor(props: OptionCommandProps) {
        Object.assign(this, props);
    }
}