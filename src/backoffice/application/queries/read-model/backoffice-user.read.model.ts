import { IHasMediaAssets } from 'src/core/domain/abstractions/media.assets.interface';
import { UserType } from 'src/users/domain/value-objects/user.type';

export class BackOfficeUserReadModel {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly name: string,
    public readonly email: string,
    public readonly description: string,
    public readonly userType: UserType,
    public avatarUrl: string | null,
    public readonly createdAt: string, //iso 8601
    public readonly updatedAt: string, //iso 8601
    public readonly isAdmin: boolean,
    public readonly isBlocked: boolean,
  ) {}

  public toJson() {
    return {
      id: this.id,
      username: this.username,
      name: this.name,
      email: this.email,
      description: this.description,
      userType: this.userType,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isAdmin: this.isAdmin,
      isBlocked: this.isBlocked,
    };
  }
}

export class PaginationInfo {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly totalCount: number,
    public readonly totalPages: number,
  ) {}

  public toJson() {
    return {
      page: this.page,
      limit: this.limit,
      totalCount: this.totalCount,
      totalPages: this.totalPages,
    };
  }

  public hasNextPage(): boolean {
    return this.page < this.totalPages;
  }

  public hasPreviousPage(): boolean {
    return this.page > 1;
  }
}

export class BackOfficeUserPaginationReadModel implements IHasMediaAssets {
  constructor(
    public readonly data: BackOfficeUserReadModel[],
    public readonly pagination: PaginationInfo,
  ) {}

  getMediaAssetIds(): string[] {
    const mediaIds: string[] = [];
    this.data.forEach((user: BackOfficeUserReadModel) => {
      if (user.avatarUrl) mediaIds.push(user.avatarUrl);
    });
    return mediaIds;
  }
  applyMediaUrls(urlMap: Map<string, string>): void {
    this.data.forEach((user: BackOfficeUserReadModel) => {
      if (user.avatarUrl && urlMap.has(user.avatarUrl)) {
        const url = urlMap.get(user.avatarUrl);
        if (url) user.avatarUrl = url;
      } else {
        user.avatarUrl = null;
      }
    });
  }

  public toJson() {
    return {
      data: this.data.map((user) => user.toJson()),
      pagination: this.pagination.toJson(),
    };
  }
}
