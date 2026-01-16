import { PlayerSubmissionEvaluationServiceTestApi } from '../../apis/domain/player-submission-evaluation.service.test.api';

describe('Pruebas en PlayerSubmissionEvaluationService (DOMAIN)', () =>{

    let test: PlayerSubmissionEvaluationServiceTestApi;


    beforeEach( ()=> {
        test = new PlayerSubmissionEvaluationServiceTestApi();
    });

    it('debería añadir la respuesta a la tabla de resultados de la slide en juego', () => {

        test
            .givenAValidSubmission()
            .whenSubmissionIsSendForEvaluation()
            .thenItShouldHaveBeenProcessedSuccesfully();


    });

    it('debería fallar si la respuesta se envía si la sesión no se encuentra en medio de una pregunta', () => {

        test
            .givenASubmissionSentNotInQuestionPhase()
            .whenSubmissionIsSendForEvaluation()
            .thenThereShouldBeNoEntryForCorrespondingSlide()
            .thenItShouldFailWith("No se pueden suministrar respuestas cuando no hay pregunta en juego!");


    });

    it('debería rechazar el envío de la respuesta si el jugador ya envió una respuesta para la slide en juego', () => {

        test
            .givenASubmissionAlreadySubmitted()
            .whenSubmissionIsSendForEvaluation()
            .thenItShouldRejectAnotherSubmission()
            .thenItShouldFailWith("El jugador ya ha enviado una respuesta para esta pregunta.")

    });


    it('NO debería registrar la respuesta si el jugador no se encuentra en la partida', () => {

        test
            .givenASubmissionForANonRegisteredPlayer()
            .whenSubmissionIsSendForEvaluation()
            .thenNoAnswerShouldHaveBeenRegistered()
            .thenItShouldFailWith("El jugador no se encuentra en la partida");

    });

    it('debería fallar si envia una respuesta para una slide que no se encuentra en juego', () => {

        test
            .givenASubmissionForASlideStillNotInPlay()
            .whenSubmissionIsSendForEvaluation()
            .thenNoAnswerCouldHaveBeenRegistered()
            .thenItShouldFailWith("La Slide a la cual se intenta añadir una entrada no ha sido puesta aún en juego o no existe");

    });


    it('debería fallar si envia una respuesta para una slide que no existe en el kahoot jugado', () => {

        test
            .givenASubmissionForASlideNotInKahootPlayed()
            .whenSubmissionIsSendForEvaluation()
            .thenNoAnswerShouldHaveBeenRegistered()
            .thenItShouldFailWith("Slide not found.");

    });





})