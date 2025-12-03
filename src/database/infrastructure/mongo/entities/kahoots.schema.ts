import { Prop, Schema } from "@nestjs/mongoose";

@Schema()
export class OptionSnapshot{
@Prop({type:String,default:null})optionText:string|null;
@Prop({type:Boolean,required:true})isCorrect:boolean;
@Prop({type:String,default:null})optionImageId:string|null;
}

@Schema()
export class KahootDetailsSnapshot{
@Prop({type:String,default:null})title:string|null;
@Prop({type:String,default:null})description:string|null;
@Prop({type:String,default:null})category:string|null;
}

@Schema()
export class KahootStylingSnapshot{
@Prop({type:String,required:true})themeId:string;
@Prop({type:String,default:null})imageId:string|null;
}

@Schema()
export class SlideSnapshot{
@Prop({type:String,required:true})id:string;
//...otraspropiedadesdeSlide
@Prop({type:[OptionSnapshot],default:null})options:OptionSnapshot[]|null;
}

@Schema({collection:'kahoots',})
export class KahootMongo extends Document{
@Prop({type:KahootDetailsSnapshot,default:null})public details:KahootDetailsSnapshot|null;
@Prop({type:KahootStylingSnapshot,required:true})public styling:KahootStylingSnapshot;
@Prop({type:[SlideSnapshot],default:null})public slides:SlideSnapshot[]|null;
}

export type KahootMongoInput=Omit<KahootMongo,keyof Document|'_id'|'__v'>;