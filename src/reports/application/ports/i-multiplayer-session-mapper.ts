

export interface MultiplayerSessionMapper<I, O, P, Q> {

    mapHostDetails(session: I ): O;
    mapPlayerDetails(session: I, playerId: string ): P | null;
    mapUserDetails(session: I, userId: string): Q;
    
}