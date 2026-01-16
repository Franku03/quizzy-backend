import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { MultiplayerSessionFactory } from "src/multiplayer-sessions/domain/factories/multiplayer-session.factory";
import { PlayerFactory } from "src/multiplayer-sessions/domain/factories/player.factory";
import { KahootAggregateMother } from "test/kahoots/object-mothers/domain/aggregate/kahoot.mother";
import { SessionPlayerAnswerValueObjectMother } from "./session.player.answer.mother";
import { SubmissionValueObjectMother } from "./submission.mother";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";

export class MultiplayerSessionAggregateMother {

  // IDs CONSTANTES: Facilitan la coincidencia de datos entre el comando del test y el mock del repositorio
    public readonly SESSION_ID = '8e763493-4ec0-427f-9c2e-3517664d7d1b';
    public readonly HOST_ID = 'ea21e050-8af6-4870-b795-ef7ddb29d43d';
    public readonly KAHOOT_ID = '14f5d158-fe86-4ba4-85cf-b83ce514c0bd';
    public readonly SESSION_PIN1 = '1234567';
    public readonly PLAYER_1 = '20936913-0c59-4ee4-ad35-634ef24d7d3d';
    public readonly PLAYER_2 = '897115b0-e3ff-4448-ac06-58584df826ea';
    public readonly PLAYER_1_NICKNAME = 'Carlitos';
    public readonly PLAYER_2_NICKNAME = 'Matilda';

    private motherSession: MultiplayerSession;
    private testKahoot: Kahoot;

    /// METODOS CONCRETOS DE ENSAMBLADOS ESPECÍFICOS

    public assembleStartedSessionWithTwoPlayers(): MultiplayerSession {

        this.createInLobbySession()                                
                    .addPlayer1()
                    .addPlayer2()
                    .startSesssion();

        return this.motherSession;

    }

    public assembleLobbyInSession(): MultiplayerSession {

        this.createInLobbySession()                                
                    .addPlayer1()
                    .addPlayer2()

        return this.motherSession;

    }

    public assembleStartedSessionWithOneAnswer(): MultiplayerSession {

        this.createInLobbySession()                                
                    .createInLobbySession()                                
                    .addPlayer1()
                    .addPlayer2()
                    .startSesssion()
                    .addAnswerForPlayer(1)

        return this.motherSession;

    }

    public assembleStartedSessionWithOnePlayer(): MultiplayerSession {

        this.createInLobbySession()                                
                    .createInLobbySession()                                
                    .addPlayer1()
                    .startSesssion();

        return this.motherSession;

    }

    /// METODOS DE CONSTRUCCIÓN POR PARTES

    public createInLobbySession(): this {

        this.motherSession =  this.createBaseSession();

        return this;

    }


    public addPlayer1(): this {

        const player1 = PlayerFactory.createPlayerForSession(
            this.PLAYER_1,
            this.PLAYER_1_NICKNAME,
            true,
        );

        this.motherSession.joinPlayer( player1.getRight() );

        return this;

    } 

    public addPlayer2(): this {

        const player2 = PlayerFactory.createPlayerForSession(
            this.PLAYER_2,
            this.PLAYER_2_NICKNAME,
            false,
        );

        this.motherSession.joinPlayer( player2.getRight() );

        return this;

    } 

    public startSesssion(): this {

        this.motherSession.startSession();
        
        // Iniciamos VO de resultados para la slide, en esta prueba si seguimos el orden siempre estamos en la primera slide
        this.motherSession.startSlideResults(this.motherSession.getCurrentSlideInSession());

        return this

    }

    public addAnswerForPlayer( playerNumber: number ): this {

        const playerId = this.motherSession.getPlayers()[ playerNumber - 1].id

        this.addAnswerFor( playerId );

        return this


    }

    /// METODOS PRIVADOS DE CONSTRUCCIÓN


    private createBaseSession(): MultiplayerSession {

        this.testKahoot = KahootAggregateMother.existingPublishedWith2Slides();

        const baseSession = MultiplayerSessionFactory.createMultiplayerSession(
            this.testKahoot,
            this.HOST_ID,
            this.SESSION_ID,
            this.SESSION_PIN1,
        )

        // Sabemos que siempre la base estará bien porque el pin es válido
        return baseSession.getRight();

    }
    


    private addAnswerFor( playerId: PlayerId ): void{

        const player1Submission = SubmissionValueObjectMother.createValidSubmission( this.testKahoot )
        
        const lastPlayerEvaluatedAnswerState = SessionPlayerAnswerValueObjectMother.createPlayerAnswerForSession(
            playerId ,
            player1Submission,
            this.testKahoot
        )

        const slideId = new SlideId(this.testKahoot.getNextSlideSnapshotByIndex()?.id!)

        this.motherSession.addPlayerAnswer( 
            slideId, 
            lastPlayerEvaluatedAnswerState
        );

    }

}