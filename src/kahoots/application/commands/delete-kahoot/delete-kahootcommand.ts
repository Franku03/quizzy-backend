import { ICommand } from 'src/core/application/cqrs/command.interface';

interface DeleteCommandProps {
    id: string; 
    userId: string;
}

export class DeleteKahootCommand implements ICommand {
    public readonly id: string;
    public readonly userId: string;

    constructor(props: DeleteCommandProps) {
        Object.assign(this, props);
    }
}