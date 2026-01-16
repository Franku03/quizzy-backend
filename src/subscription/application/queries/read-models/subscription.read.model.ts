export class SubscriptionReadModel {
  constructor(
    public readonly userId: string,
    public readonly plan: string,
    public readonly status: string,
    public readonly expiresAt: string | null,
  ) {}
}