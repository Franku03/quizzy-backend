export enum GameType {

    MULTIPLAYER_HOST = "Multiplayer_host",
    MULTIPLAYER_PLAYER = "Multplayer_player",
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
    finalScore:      number;
    rankingPosition: number;
}

export class UserGameReportDetails {

    constructor(
        public readonly results: UserResult[],
        public readonly meta:    Meta,
    ){}


}