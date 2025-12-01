import { Optional } from "src/core/types/optional";
import { AnswerSelected } from "../shared-value-objects/value-objects/value.object.answer-selected";
import { Submission } from '../shared-value-objects/parameter-objects/parameter.object.submission';

// Devolvemos un optional porque en el solo-attempt se usa un Optional en las props, sin embargo creo que no haria falta porque siempre podemos devolver un arreglo vacio
export const mapToAnswerSelected = ( submission :Submission): Optional<AnswerSelected[]> => {

    let answerContent: Optional<AnswerSelected[]>;

    if( !submission.getAnswerText().hasValue() ){

        // options vacio
        answerContent = new Optional<AnswerSelected[]>([]);

    } else {

        // Mapeamos las Options a AnswerSelected 
        const options = submission.getAnswerText().getValue();

        const selectedAnswers = options.map( opt => {
            return AnswerSelected.create(
                opt.hasText() ? opt.getText() : null,
                opt.isCorrectAnswer(),
                opt.hasImage() ? opt.getImage().getValue() : null
                //  Version para solo trabajar con el string del Id y no el VO
                //  opt.hasImage() ? opt.getImage().getValue().value : null
            )
        })

        answerContent = new Optional<AnswerSelected[]>( selectedAnswers ); 
    }

    return answerContent;

}