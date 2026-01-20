import { IQuery } from "src/core/application/cqrs";

export class GetDetailedPlayerReportQuery implements IQuery {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string
  ) {}
}