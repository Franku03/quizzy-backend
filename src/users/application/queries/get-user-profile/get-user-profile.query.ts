import { IQuery } from "src/core/application/cqrs/query.interface";

export class GetUserProfileQuery implements IQuery {
  public readonly userId: string;
  public readonly targetUserId: string;

  constructor(props: { userId: string; targetUserId: string }) {
      Object.assign(this, props);
  }
}