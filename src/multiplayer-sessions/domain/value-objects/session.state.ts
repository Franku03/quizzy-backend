import { ValueObject } from 'src/core/domain/abstractions/value.object';
import { SessionStateType } from './session.state.type';

interface SessionStateProps {
    state: SessionStateType,
};

export class SessionState extends ValueObject<SessionStateProps> {

    public constructor(
      state: SessionStateType  
    ){
        super({ state });
    };

    public isLobby(): boolean {
        return this.properties.state === SessionStateType.LOBBY;
    };

    public isQuestion(): boolean {
        return this.properties.state === SessionStateType.QUESTION;
    };    

    public isResults(): boolean {
        return this.properties.state === SessionStateType.RESULTS;
    };

    public isEnd(): boolean {
        return this.properties.state === SessionStateType.END;
    };

    public canTransitionTo( target: SessionStateType ): boolean {


        switch( target ){

            // Ningun estado puede pasar a LOBBY
            case( SessionStateType.LOBBY ):
                return false;

            // LOBBY puede pasar a QUESTION (Inicio de la partida) y RESULTS puede pasar a QUESTION (Quedan preguntas todavia en el juego)
            case( SessionStateType.QUESTION ): {
                if( this.properties.state === SessionStateType.LOBBY || this.properties.state === SessionStateType.RESULTS )
                    return true;

                return false;
            };
            
            // solo QUESTION puede pasar a RESULTS (Mostrar los resultados de la ronda de preguntas)
            case( SessionStateType.RESULTS ): {

                if( this.properties.state === SessionStateType.QUESTION )
                    return true;

                return false;
            };

            // solo RESULTS puede pasar a END cuando ya no quedan mas preguntas restantes
            case( SessionStateType.END ): {

                if( this.properties.state === SessionStateType.RESULTS )

                return false;
            };

            default:
                return false

        };

    };

    // ? Para evitar que se puedan crear estados iniciales que no sean lobby desde el cliente
    public static createAsLobby(): SessionState {
        return new SessionState( SessionStateType.LOBBY );
    }


    public toQuestion(): SessionState {

        if( this.canTransitionTo( SessionStateType.QUESTION ) )
            return new SessionState(SessionStateType.QUESTION);

        throw new Error(`No se puede pasar al estado QUESTION desde el estado ${ this.properties.state }`);
    };


    public toResults(): SessionState {

        if( this.canTransitionTo( SessionStateType.RESULTS ) )
            return new SessionState(SessionStateType.RESULTS);

        throw new Error(`No se puede pasar al estado RESULTS desde el estado ${ this.properties.state }`);

    };


    public toEnd(): SessionState {

        if( this.canTransitionTo( SessionStateType.END ) )
            return new SessionState( SessionStateType.END );

        throw new Error(`No se puede pasar al estado END desde el estado ${ this.properties.state }`);

    };

    public getActualState(): SessionStateType {

        return this.properties.state 

    }


}