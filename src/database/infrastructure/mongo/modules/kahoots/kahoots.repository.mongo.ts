import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { KahootMongo } from 'src/database/infrastructure/mongo/entities/kahoots.schema';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { Optional } from 'src/core/types/optional';
import { KahootFactory } from 'src/kahoots/domain/factories/kahoot.factory';
import { KahootSnapshot } from 'src/core/domain/snapshots/snpapshot.kahoot';

@Injectable()
export class KahootRepositoryMongo implements IKahootRepository {
  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) {}

  public async saveKahoot(kahoot: Kahoot): Promise<void> {
    const persistenceData = kahoot.getSnapshot();

    try {
      // 2. Persistencia: Usa findOneAndUpdate
      await this.kahootModel
        .findOneAndUpdate({ id: kahoot.id.value }, persistenceData, {
          upsert: true,
          new: true,
          runValidators: true,
        })
        .exec();
    } catch (error) {
      // 3. Capturar la violación del índice único de Mongo (código 11000)
      if (error.code === 11000) {
        // Lanza Error estándar en lugar de DuplicateIdError
        throw new Error(
          `Kahoot ID ${kahoot.id.value} ya existe en la base de datos.`,
        );
      }
      throw error;
    }
  }
  public async findKahootById(id: KahootId): Promise<Optional<Kahoot>> {
    const document = await this.kahootModel.findOne({ id: id.value }).exec();

    if (!document) {
      return new Optional<Kahoot>();
    }

    // El objeto plano que devuelve Mongoose no tiene la tipografía
    // explícita de KahootDetailsSnapshot, lo que causa el error.
    // Usamos 'as KahootSnapshot' para indicarle a TypeScript que confíe en el mapeo.
    const kahoot = KahootFactory.reconstructFromSnapshot(
      document.toObject() as KahootSnapshot, // 💡 LA CORRECCIÓN
    );

    return new Optional(kahoot);
  }
  public async findAllKahoots(): Promise<Kahoot[]> {
    const documents = await this.kahootModel.find().exec();

    // 💡 CORRECCIÓN: Aplicamos la afirmación de tipo a cada documento
    // para asegurar que la Fábrica reciba la estructura de KahootSnapshot.
    return documents.map((doc) =>
      KahootFactory.reconstructFromSnapshot(doc.toObject() as KahootSnapshot),
    );
  }
  public async deleteKahoot(id: KahootId): Promise<void> {
    await this.kahootModel.deleteOne({ id: id.value }).exec();
  }
}
