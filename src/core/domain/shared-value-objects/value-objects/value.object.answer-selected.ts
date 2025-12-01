
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Either } from "src/core/types/either";
import { ImageId } from "../id-objects/image.id";

// TODO: Si no usamos el VO de ImageId al final, cambiamos este type por string | null y mandamos solo el string del Id (lo que contiene el VO)
type ImageIdRef = ImageId | null ;
type OptionText = string | null ;


interface AnswerSelectedProps {
  isCorrect: boolean,
  // Monada Either para saber si tenemos una imagen o un texto en la opcion
  answerContent: Either< ImageId, string >
}

// Used by game engines to represent an answer selected by a player in a question
export class AnswerSelected extends ValueObject<AnswerSelectedProps>{

    private constructor(props: AnswerSelectedProps) {
        super(props);
    }

    // Factory Method (used by clients to pass direct parameters instead of props object)
      public static create(
        optionText: OptionText, 
        isCorrect: boolean, 
        optionImageId: ImageIdRef
      ): AnswerSelected {

        let answerContent: Either< ImageId, string >

        if( !optionText && optionImageId ){
          // Izquierda: Caso donde la opcion tiene una Imagen    
          answerContent = Either.makeLeft( optionImageId ); // le decimos a TS que confie que siempre habra una imagen y no sera null
        } else if( optionText && !optionImageId ){
          // Derecha: Caso donde la opcion tiene un texto
          answerContent = Either.makeRight( optionText );
        } else {
          throw new Error ("No hay ni texto ni tampoco Imagen asociado a la opcion");
        }

        return new AnswerSelected({
          isCorrect: isCorrect,
          answerContent,
        });

      } 

    public get isCorrect(): boolean {
        return this.properties.isCorrect;
    }

    public hasText(): boolean {
      return this.properties.answerContent.isRight();
    }

    public hasImage(): boolean {
      return this.properties.answerContent.isLeft();
    }

    // * Si no queremos usar ya el VO de imageId esta funcion solo debe devolver string | null
    // Devuelve ImageId | string | null para que el compilador de TS no reclame, porque los tipos definidos arriba tambien admiten null y en teoria la funcion podria devolver eso
    public getAnswerContent(): ImageId | string {

      // Devuelve el imageId
      if( this.hasImage() ){
        return this.properties.answerContent.getLeft();
      } 

      // Devuelve el text
      return this.properties.answerContent.getRight();

    } 

}