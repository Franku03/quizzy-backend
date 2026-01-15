import { IHasMediaAssets } from 'src/core/domain/abstractions/media.assets.interface';

// Interfaz para el DAO al consultar usuarios
export interface UserNotificationFilter {
  sendToAdmins?: boolean;
  sendToRegularUsers?: boolean;
}

// Interfaz para el DAO para los usuarios a los q se le manda notificacion
export interface UserForNotification {
  id: string; // userId
  email: string;
  name: string; // nombre del usuario para personalizar el saludo
}

// Interface para el sender (remitente)
export interface NotificationSender {
  imageUrl: string | null;
  id: string; // UserId
  name: string;
  email: string;
}

// Modelo de lectura individual para notificación
export class BackofficeNotificationReadModel implements IHasMediaAssets {
  constructor(
    public readonly id: string, // UUID
    public readonly title: string,
    public readonly message: string,
    public readonly createdAt: string, // ISO8601
    public readonly sender: NotificationSender,
  ) {}

  /**
   * Implementación de IHasMediaAssets
   * Extrae todos los IDs de assets (IDs de MongoDB/UUIDs)
   */
  getMediaAssetIds(): string[] {
    const mediaIds: string[] = [];
    
    // Basado en LibraryReadModel: simplemente verifica si existe y lo agrega
    if (this.sender.imageUrl) mediaIds.push(this.sender.imageUrl);
    
    return mediaIds;
  }

  /**
   * Implementación de IHasMediaAssets
   * Inyecta las URLs finales una vez resueltas
   */
  applyMediaUrls(urlMap: Map<string, string>): void {
    // Basado en LibraryReadModel: verifica si existe y si está en el mapa
    if (this.sender.imageUrl && urlMap.has(this.sender.imageUrl)) {
      const url = urlMap.get(this.sender.imageUrl);
      if (url) {
        this.sender.imageUrl = url;
      }
    } else {
      // Si no está en el mapa o es null, establecer como null
      this.sender.imageUrl = null;
    }
  }

  public toJson() {
    return {
      id: this.id,
      title: this.title,
      message: this.message,
      createdAt: this.createdAt,
      sender: {
        imageUrl: this.sender.imageUrl,
        id: this.sender.id,
        name: this.sender.name,
        email: this.sender.email,
      },
    };
  }
}

// Info de paginación (puedes reusar la misma PaginationInfo si quieres)
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

// Modelo de paginación para notificaciones
export class BackofficeNotificationPaginationReadModel implements IHasMediaAssets {
  constructor(
    public readonly data: BackofficeNotificationReadModel[],
    public readonly pagination: PaginationInfo,
  ) {}

  /**
   * Implementación de IHasMediaAssets
   * Extrae todos los IDs de assets de todas las notificaciones
   */
  getMediaAssetIds(): string[] {
    const mediaIds: string[] = [];
    this.data.forEach((notification: BackofficeNotificationReadModel) => {
      // Basado en LibraryReadModel: simplemente agrega si existe
      if (notification.sender.imageUrl) mediaIds.push(notification.sender.imageUrl);
    });
    return mediaIds;
  }

  /**
   * Implementación de IHasMediaAssets
   * Inyecta las URLs finales a todas las notificaciones
   */
  applyMediaUrls(urlMap: Map<string, string>): void {
    this.data.forEach((notification: BackofficeNotificationReadModel) => {
      // Basado en LibraryReadModel: aplica directamente
      if (notification.sender.imageUrl && urlMap.has(notification.sender.imageUrl)) {
        const url = urlMap.get(notification.sender.imageUrl);
        if (url) {
          notification.sender.imageUrl = url;
        }
      } else {
        notification.sender.imageUrl = null;
      }
    });
  }

  public toJson() {
    return {
      data: this.data.map((notification) => notification.toJson()),
      pagination: this.pagination.toJson(),
    };
  }
}
