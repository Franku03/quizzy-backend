// kahoot.schema.ts (Estructura de Persistencia)

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Definición de sub-esquemas (que coinciden con los Snapshots)

const OptionSnapshotSchema = {
    optionText: { type: String, default: null },
    isCorrect: { type: Boolean, required: true },
    optionImageId: { type: String, default: null },
};

const SlideSnapshotSchema = {
    id: { type: String, required: true }, 
    position: { type: Number, required: true },
    slideType: { type: String, required: true },
    timeLimitSeconds: { type: Number, required: true },
    questionText: { type: String, default: null }, 
    slideImageId: { type: String, default: null }, 
    pointsValue: { type: Number, default: null }, 
    descriptionText: { type: String, default: null }, 
    options: { type: [OptionSnapshotSchema], default: null }, 
};

const KahootDetailsSnapshotSchema = {
    title: { type: String, default: null },
    description: { type: String, default: null },
    category: { type: String, default: null },
};

const KahootStylingSnapshotSchema = {
    themeId: { type: String, required: true },
    imageId: { type: String, default: null }, 
};


@Schema({
    collection: 'kahoots',
})
export class KahootMongo extends Document {
    
    // El ID principal que usamos para buscar y garantizar unicidad
    @Prop({ required: true, unique: true, index: true })
    declare id: string; // Mapea a KahootSnapshot.id (NO el _id de Mongo)
    
    @Prop({ required: true, index: true })
    public authorId: string;

    @Prop({ required: true })
    public createdAt: string; // Usamos Date en Mongo, no DateISO

    @Prop({ type: KahootDetailsSnapshotSchema, default: null })
    public details: object | null; // Mapea a KahootDetailsSnapshot | null

    @Prop({ required: true })
    public visibility: string; 

    @Prop({ required: true })
    public status: string; 
    
    @Prop({ default: 0 })
    public playCount: number;

    @Prop({ type: KahootStylingSnapshotSchema, required: true })
    public styling: object; // Mapea a KahootStylingSnapshot

    @Prop({ type: [SlideSnapshotSchema], default: null })
    public slides: object[] | null; // Mapea a SlideSnapshot[] | null

    
}

export const KahootSchema = SchemaFactory.createForClass(KahootMongo);
