interface DeleteCommandProps {
    id: string; 
    userId: string;
}

export class DeleteKahootCommand {
    public readonly id: string;
    public readonly userId: string;

    constructor(props: DeleteCommandProps) {
        Object.assign(this, props);
    }
}