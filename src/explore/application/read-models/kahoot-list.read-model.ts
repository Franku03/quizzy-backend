// kahoot-list.read-model.ts
export class KahootListReadModel {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly category: string,
    public readonly author: { id: string; name: string },
    public readonly playCount: number,
    public readonly createdAt: Date,
    public readonly coverImageId: string | null,
    public readonly themeId: string
  ) {}
}


// paginated-kahoot-list.read-model.ts
export class PaginatedKahootListReadModel {
  constructor(
    public readonly data: KahootListReadModel[],
    public readonly pagination: {
      page: number,
      limit: number,
      totalCount: number,
      totalPages: number
    }
  ) {}
}