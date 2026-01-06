import { IQuery } from 'src/core/application/cqrs/query.interface';

interface GetKahootByIdProps {
    kahootId: string;
    userId: string | undefined;
}

export class GetKahootPreviewQuery implements IQuery {
    public readonly kahootId: string;
    public readonly userId?: string;
    constructor(props: GetKahootByIdProps) {
        Object.assign(this, props);
    }
}