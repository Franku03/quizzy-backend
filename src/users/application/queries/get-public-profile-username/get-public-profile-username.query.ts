import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetPublicProfileUsernameQuery implements IQuery {
    public readonly username: string;

    constructor(props: { username: string }) {
        Object.assign(this, props);
    }
}