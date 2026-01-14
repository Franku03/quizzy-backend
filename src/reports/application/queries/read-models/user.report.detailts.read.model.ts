export enum GameType {

    MULTIPLAYER_HOST = "Multiplayer_host",
    MULTIPLAYER_PLAYER = "Multiplayer_player",
    SINGLEPLAYER = "Singleplayer",

}

export interface Meta {
    totalItems:  number;
    currentPage: number;
    totalPages:  number;
    limit:       number;
}

export interface UserResult {
    kahootId:        string;
    gameId:          string;
    gameType:        GameType;
    title:           string;
    completionDate:  Date;
    finalScore?:      number; // Si es el usuario fue host no debería tener finalScore
    rankingPosition?: number; // Si es attempt no tiene ranking, si fue host no tiene ranking
}

export class UserGameReportDetails {

    constructor(
        public readonly results: UserResult[],
        public readonly meta:    Meta,
    ){}


}