import { MockProxy } from "jest-mock-extended";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { PlayerSubmissionEvaluationService } from "src/multiplayer-sessions/domain/domain-services/player-submission-evaluation.service";
import { MultiplayerSessionAggregateMother } from '../../object-mothers/domain/multiplayer-session.mother';
import { KahootAggregateMother } from "test/kahoots/object-mothers/domain/aggregate/kahoot.mother";
import { SubmissionValueObjectMother } from "test/multiplayer-sessions/object-mothers/domain/submission.mother";
import { PlayerIdValue } from "src/multiplayer-sessions/domain/types";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Either, ErrorData } from "src/core/types";
import { SessionPlayerAnswer } from "src/multiplayer-sessions/domain/value-objects";
import { SessionPlayerAnswerValueObjectMother } from "test/multiplayer-sessions/object-mothers/domain/session.player.answer.mother";



export class PlayerSubmissionEvaluationServiceTestApi {

    // Constants
    private readonly NON_REGISTERED_PLAYER_ID = '897115b0-e3ff-4448-ac06-58584df826ea';

    // Builders/Mothers
    private sessionBuilder: MultiplayerSessionAggregateMother = new MultiplayerSessionAggregateMother();

    // SUT
    private readonly evaluationService: PlayerSubmissionEvaluationService;

    // Estado Interno para capturar resultados
    private lastSessionState: MultiplayerSession;
    private lastKahootState: Kahoot;
    private lastSubmissionState: [PlayerIdValue, Submission];
    private lastSlideIdState: SlideId;
    private lastResultState: Either<ErrorData, void>;


    constructor(){

        // Inicizalizamos el SUT
        this.evaluationService = new PlayerSubmissionEvaluationService();

    };

   // * ARRANGE

    private assembleCommonGivenStates(): void {

        this.lastKahootState = KahootAggregateMother.existingPublishedWith2Slides();   
        
        this.lastSubmissionState = [
            this.lastSessionState.getPlayers()[0].getPlayerId(),
            SubmissionValueObjectMother.createValidSubmission( this.lastKahootState ),
        ]

        this.lastSlideIdState = new SlideId( this.lastKahootState.getNextSlideSnapshotByIndex()?.id! );

    }


    public givenAValidSubmission(): PlayerSubmissionEvaluationServiceTestApi {

        this.lastSessionState = this.sessionBuilder.assembleStartedSessionWithTwoPlayers();
                    
        this.assembleCommonGivenStates();

        return this;

    }


    givenASubmissionSentNotInQuestionPhase(): PlayerSubmissionEvaluationServiceTestApi {

        this.lastSessionState = this.sessionBuilder.assembleLobbyInSession();

        this.assembleCommonGivenStates();

        return this;

    }

    givenASubmissionAlreadySubmitted(): PlayerSubmissionEvaluationServiceTestApi {


        this.lastSessionState = this.sessionBuilder.assembleStartedSessionWithOneAnswer();
                    
        this.assembleCommonGivenStates();

        return this;

    }

    givenASubmissionForANonRegisteredPlayer(): PlayerSubmissionEvaluationServiceTestApi {


        this.lastSessionState = this.sessionBuilder.assembleStartedSessionWithOnePlayer();
                    
        this.assembleCommonGivenStates();

        this.lastSubmissionState = [
            this.NON_REGISTERED_PLAYER_ID,
            SubmissionValueObjectMother.createValidSubmission( this.lastKahootState ),
        ]
    
        return this;

    }

    givenASubmissionForASlideStillNotInPlay(): PlayerSubmissionEvaluationServiceTestApi {


        this.lastSessionState = this.sessionBuilder.assembleStartedSessionWithTwoPlayers();
                    
        this.assembleCommonGivenStates();

        this.lastSubmissionState = [
            this.lastSessionState.getPlayers()[0].getPlayerId(),
            SubmissionValueObjectMother.createSubmissionForSlideStillNotPlayed( this.lastKahootState ),
        ]

        this.lastSlideIdState = new SlideId( this.lastKahootState.getNextSlideSnapshotByIndex(0)?.id! )

        return this;

    }

    givenASubmissionForASlideNotInKahootPlayed(): PlayerSubmissionEvaluationServiceTestApi {


        this.lastSessionState = this.sessionBuilder.assembleStartedSessionWithTwoPlayers();
                    
        this.assembleCommonGivenStates();

        this.lastSubmissionState = [
            this.lastSessionState.getPlayers()[0].getPlayerId(),
            SubmissionValueObjectMother.createInvalidSubmission( this.lastKahootState ),
        ]

        return this;

    }



    // * ACT


    public whenSubmissionIsSendForEvaluation(): PlayerSubmissionEvaluationServiceTestApi {


        const result = this.evaluationService.evaluatePlayerSubmission( 
            this.lastKahootState,
            this.lastSessionState,
            this.lastSubmissionState,
            this.lastSlideIdState
        )

        this.lastResultState = result;
        
        return this;

    }

    // * ASSERT

    // EXITO

    public thenItShouldHaveBeenProcessedSuccesfully(): void {

       const answersSubmitted = this.lastSessionState.getPlayersAnswersForASlide( this.lastSlideIdState )?.length;

       expect( answersSubmitted ).toBe( 1 );
       expect( this.lastResultState.isRight() ).toBeTruthy( );
       expect( this.lastResultState.getRight() ).toBeUndefined();

    }

    // FALLO

    public thenItShouldRejectAnotherSubmission(): PlayerSubmissionEvaluationServiceTestApi {


       expect( this.lastSessionState.getPlayersAnswersForASlide( this.lastSlideIdState )?.length ).toBe( 1 );
       expect( this.lastResultState.isLeft()  ).toBeTruthy();

       return this;


    }

    public thenNoAnswerCouldHaveBeenRegistered(): PlayerSubmissionEvaluationServiceTestApi {

       expect( this.lastSessionState.getPlayersAnswersForASlide( this.lastSlideIdState ) ).toBeUndefined();
       expect( this.lastSessionState.getPlayersAnswersForASlide( this.lastSlideIdState )).toBeUndefined();
       expect( this.lastResultState.isLeft()  ).toBeTruthy();

       return this;

    }


    public thenNoAnswerShouldHaveBeenRegistered(): PlayerSubmissionEvaluationServiceTestApi {

       expect( this.lastSessionState.getPlayersAnswersForASlide( this.lastSlideIdState ) ).toBeDefined();
       expect( this.lastSessionState.getPlayersAnswersForASlide( this.lastSlideIdState )?.length ).toBe( 0 );
       expect( this.lastResultState.isLeft()  ).toBeTruthy();

       return this;

    }

    
    public thenThereShouldBeNoEntryForCorrespondingSlide(): PlayerSubmissionEvaluationServiceTestApi {
                
        expect( this.lastSessionState.getPlayersAnswersForASlide( this.lastSlideIdState ) ).toBeUndefined();
        expect( this.lastResultState.isLeft()  ).toBeTruthy();

        return this
        
    }
    
    public thenItShouldFailWith( errorMessage: string ): void {

       expect( this.lastResultState.getLeft().message ).toBe( errorMessage );

    }
}