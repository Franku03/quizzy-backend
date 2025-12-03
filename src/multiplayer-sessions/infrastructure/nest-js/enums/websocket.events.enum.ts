
export enum HostUserEvents {

    HOST_START_GAME = "host_start_game",
    HOST_NEXT_PHASE = "host_next_phase",

}

export enum PlayerUserEvents {

    PLAYER_SUBMIT_ANSWER = "player_submit_answer",
    PLAYER_JOIN = "player_join",

}


export enum ServerEvents {

    HOST_CONNECTED_SUCCESS = "host_connected_success",
    PLAYER_CONNECTED_SUCCESS = "player_connected_success",

    QUESTION_STARTED = "question_started",
    QUESTION_RESULTS = "question_results",
    GAME_STATE_UPDATE = "game_state_update",
    GAME_END = "game_end",

}