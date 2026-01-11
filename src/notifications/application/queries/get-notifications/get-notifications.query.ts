import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetNotificationsQuery implements IQuery {
    constructor(
        public readonly userId: string,
        public readonly limit: number,
        public readonly page: number,
    ) {}
}
