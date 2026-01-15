import { IHasMediaAssets } from 'src/core/domain/abstractions/media.assets.interface';
import { UserType } from 'src/users/domain/value-objects/user.type';

export class BackOfficeUserReadModel implements IHasMediaAssets {
  constructor(
    public readonly id: string, // UUID (User Id)
    public readonly username: string,
    public readonly name: string,
    public readonly email: string,
    public readonly description: string,
    public readonly userType: string, // Cambiado de UserType a string
    public avatarUrl: string | null,
    public readonly createdAt: string, // ISO8601
    public readonly updatedAt: string, // ISO8601
    public readonly isAdmin: boolean,
    public readonly status: string, // Cambiado de isBlocked a status: "Active" | "Blocked"
  ) {}

  /**
   * Implementación de IHasMediaAssets
   * Extrae todos los IDs de assets (IDs de MongoDB/UUIDs)
   */
  getMediaAssetIds(): string[] {
    const mediaIds: string[] = [];
    
    // Basado en LibraryReadModel: simplemente verifica si existe y lo agrega
    if (this.avatarUrl) mediaIds.push(this.avatarUrl);
    
    return mediaIds;
  }

  /**
   * Implementación de IHasMediaAssets
   * Inyecta las URLs finales una vez resueltas
   */
  applyMediaUrls(urlMap: Map<string, string>): void {
    // Basado en LibraryReadModel: verifica si existe y si está en el mapa
    if (this.avatarUrl && urlMap.has(this.avatarUrl)) {
      const url = urlMap.get(this.avatarUrl);
      if (url) {
        // Necesitamos un workaround ya que avatarUrl es readonly en el constructor
        // pero se declara sin readonly en la propiedad
        this.avatarUrl = url;
      }
    } else {
      // Si no está en el mapa o es null, establecer como null
      this.avatarUrl = null;
    }
  }

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
      status: this.status,
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
      // Basado en LibraryReadModel: simplemente agrega si existe
      if (user.avatarUrl) mediaIds.push(user.avatarUrl);
    });
    return mediaIds;
  }
  
  applyMediaUrls(urlMap: Map<string, string>): void {
    this.data.forEach((user: BackOfficeUserReadModel) => {
      // Basado en LibraryReadModel: aplica directamente
      if (user.avatarUrl && urlMap.has(user.avatarUrl)) {
        const url = urlMap.get(user.avatarUrl);
        if (url) {
          (user as any).avatarUrl = url;
        }
      } else {
        (user as any).avatarUrl = null;
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