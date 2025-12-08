// src/kahoot/domain/ports/out/kahoot-repository.interface.ts
import { Optional } from 'src/core/types/optional';
import { Either, ErrorData } from 'src/core/types';
import { Kahoot } from '../aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';

export interface IKahootRepository {
  // ========== LEGACY (NO TOCAR) ==========
  // Estos SÍ usan KahootId (Value Object de dominio)
  saveKahoot(kahoot: Kahoot): Promise<void>;
  findKahootById(id: KahootId): Promise<Optional<Kahoot>>;
  findAllKahoots(): Promise<Kahoot[]>;
  deleteKahoot(id: KahootId): Promise<void>;
  
  // ========== NUEVO CON Either (CON string, NO KahootId) ==========
  // Ahora reciben string puro para desacoplar
  saveKahootEither(kahoot: Kahoot): Promise<Either<ErrorData, void>>;
  findKahootByIdEither(id: string): Promise<Either<ErrorData, Kahoot | null>>; // <- CAMBIO
  findAllKahootsEither(): Promise<Either<ErrorData, Kahoot[]>>;
  deleteKahootEither(id: string): Promise<Either<ErrorData, void>>; // <- CAMBIO
  existsKahootEither(id: string): Promise<Either<ErrorData, boolean>>; // <- CAMBIO
}