import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// --- I. SUB-ESQUEMAS (Clases de Mongoose, fuente única de verdad) ---

// 1. Esquema para las Opciones de la Pregunta
@Schema()
export class OptionSnapshot {
@Prop({ type: String, default: null })
optionText: string | null;
@Prop({ type: Boolean, required: true })
isCorrect: boolean;
@Prop({ type: String, default: null })
optionImageId: string | null;
}

// 2. Esquema para los Detalles del Kahoot (Título, Descripción, Categoría)
@Schema()
export class KahootDetailsSnapshot {
@Prop({ type: String, default: null })
title: string | null;
@Prop({ type: String, default: null })
description: string | null;
@Prop({ type: String, default: null })
category: string | null;
}

// 3. Esquema para el Estilo y Diseño del Kahoot
@Schema()
export class KahootStylingSnapshot {
@Prop({ type: String, required: true })
themeId: string;
@Prop({ type: String, default: null })
imageId: string | null;
}

// 4. Esquema para una Diapositiva/Pregunta
@Schema()
export class SlideSnapshot {
@Prop({ type: String, required: true })
id: string;
@Prop({ type: Number, required: true })
position: number;
@Prop({ type: String, required: true })
slideType: string;
@Prop({ type: Number, required: true })
timeLimitSeconds: number;
@Prop({ type: String, default: null })
questionText: string | null;
@Prop({ type: String, default: null })
slideImageId: string | null;
@Prop({ type: Number, default: null })
pointsValue: number | null;
@Prop({ type: String, default: null })
descriptionText: string | null;
@Prop({ type: [OptionSnapshot], default: null }) // Referencia al esquema de opciones
options: OptionSnapshot[] | null;
}


// --- II. CLASE PRINCIPAL (Documento Kahoot) ---

@Schema({
collection: 'kahoots',
timestamps: true, // Esto añade createdAt y updatedAt automáticamente en Mongoose
})
export class KahootMongo extends Document {
// El ID principal de la aplicación
@Prop({ required: true, unique: true, index: true })
declare id: string;

// ID del autor (creador)
@Prop({ required: true, index: true })
public authorId: string;

// Detalles: Título, descripción, etc.
@Prop({ type: KahootDetailsSnapshot, default: null })
public details: KahootDetailsSnapshot | null;

// Visibilidad: público, privado, etc.
@Prop({ required: true })
public visibility: string;

// Estado del Kahoot: borrador, publicado, archivado
@Prop({ required: true })
public status: string;

// Contador de veces que se ha jugado
@Prop({ default: 0 })
public playCount: number;

// Estilo: Tema e imagen de portada
@Prop({ type: KahootStylingSnapshot, required: true })
public styling: KahootStylingSnapshot;

// Lista de preguntas/diapositivas
@Prop({ type: [SlideSnapshot], default: null })
public slides: SlideSnapshot[] | null;


public createdAt: string; 
public updatedAt: string;
}

export const KahootSchema = SchemaFactory.createForClass(KahootMongo);

// --- III. TIPO DE ENTRADA (DTO de Persistencia) ---

export type KahootMongoInput = Omit<KahootMongo, keyof Document | '_id' | '__v'> & {
    id: string; 
    createdAt: string;
};