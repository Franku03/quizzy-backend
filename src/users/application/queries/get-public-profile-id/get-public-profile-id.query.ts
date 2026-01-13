import { IQuery } from "src/core/application/cqrs/query.interface";

export class GetPublicProfileIdQuery implements IQuery {
  public readonly targetUserId: string;

  constructor(props: { targetUserId: string }) {
      Object.assign(this, props);
  }
}