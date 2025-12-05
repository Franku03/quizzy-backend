export class RemoveKahootFromFavoritesCommand {
  constructor(
    public readonly userId: string,
    public readonly kahootId: string,
  ) {}
}
