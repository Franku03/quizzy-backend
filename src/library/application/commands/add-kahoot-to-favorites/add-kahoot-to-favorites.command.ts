export class AddKahootToFavoritesCommand {
  constructor(
    public readonly userId: string,
    public readonly kahootId: string,
  ) {}
}
