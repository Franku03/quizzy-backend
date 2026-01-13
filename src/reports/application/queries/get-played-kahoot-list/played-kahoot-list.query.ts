import { IQuery } from "src/core/application/cqrs";

export class GetPlayedKahootListQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly limit: number,
    public readonly page: number,
  ) {}
}