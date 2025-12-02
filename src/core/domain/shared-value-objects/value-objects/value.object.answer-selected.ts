
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Either } from "src/core/types/either";
import { ImageId } from "../id-objects/image.id";
import { Submission } from "../parameter-objects/parameter.object.submission";

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

    // Factory Methods for specific cases 

    // To create from options with Image
    public static createFromImage(
      optionImageId: ImageId, 
      isCorrect: boolean
    ): AnswerSelected {
      return new AnswerSelected({
        isCorrect: isCorrect,
        answerContent: Either.makeLeft( optionImageId )
      });
    }

    // To create from options with Image but passing string Id directly 
    public static createFromImageIdString(
      optionImageIdString: string, 
      isCorrect: boolean
    ): AnswerSelected {
      return new AnswerSelected({
        isCorrect: isCorrect,
        answerContent: Either.makeLeft( new ImageId( optionImageIdString ) )
      });
    }

    // To create from options with Text
    public static createFromText(
      optionText: string, 
      isCorrect: boolean
    ): AnswerSelected {
      return new AnswerSelected({
        isCorrect: isCorrect,
        answerContent: Either.makeRight( optionText )
      });
    }

  // Mapea un conjunto de Options de un Submission a un conjunto de AnswerSelected
   public static createFromOptions( submission :Submission): AnswerSelected[] {
    
      let answerContent: AnswerSelected[];
      let submissionOptions = submission.getAnswerText();

      if( !submissionOptions.hasValue() ){
          // Se devuelve un arreglo vacio si no hay AnswerText en el Submission
          answerContent = [];
      } 
      else {

          // Mapeamos las Options a AnswerSelected 
          const options = submissionOptions.getValue();

          const selectedAnswers = options.map( opt => {
              return AnswerSelected.mapFromOption(
                  opt.hasText() ? opt.getText() : null,
                  opt.isCorrectAnswer(),
                  opt.hasImage() ? opt.getImage().getValue() : null
                  //  Version para solo trabajar con el string del Id y no el VO
                  //  opt.hasImage() ? opt.getImage().getValue().value : null
              )
          })

          answerContent = selectedAnswers; 
      }

      return answerContent;
    
    }
    
    private static mapFromOption(
      optionText: string | null, 
      isCorrect: boolean, 
      optionImageId: ImageId | null
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

    // Devuelve el contenido de la respuesta, ya sea el texto o el Id de la imagen 
    // Son mutualmente excluyentes, por lo que solo uno de los dos valores sera retornado
    public getAnswerContent(): string {

      // Devuelve el valor del imageId
      if( this.hasImage() ){
        return this.properties.answerContent.getLeft().value;
      } 

      // Devuelve el texto
      return this.properties.answerContent.getRight();

    } 

}