export class GetAttemptStatusQuery {
  // This query carries the unique identifier of the attempt we want to retrieve.
  // It corresponds to the 'attemptId' parameter in the API route.
  constructor(public readonly attemptId: string) {}
}