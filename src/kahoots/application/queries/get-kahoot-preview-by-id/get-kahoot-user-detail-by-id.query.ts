import { IQuery } from 'src/core/application/cqrs/query.interface';

interface GetKahootUserDetailByIdProps {
    kahootId: string;
    userId: string | undefined;
}

export class GetKahootUserDetailById implements IQuery {
    public readonly kahootId: string;
    public readonly userId?: string;
    constructor(props: GetKahootUserDetailByIdProps) {
        Object.assign(this, props);
    }
}