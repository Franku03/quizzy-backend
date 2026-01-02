
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
    PLAYER_CONNECTED_TO_SERVER = "player_connected_to_server",
    PLAYER_CONNECTED_TO_SESSION = "player_connected_to_session",
    PLAYER_ANSWER_CONFIRMATION = "player_answer_confirmation",


    GAME_STATE_UPDATE = "game_state_update",
    QUESTION_STARTED = "question_started",
    HOST_RESULTS = "host_results",
    PLAYER_RESULTS = "player_results",
    // QUESTION_RESULTS = "question_results",
    HOST_GAME_END = "host_game_end",
    PLAYER_GAME_END = "player_game_end",
    // GAME_END = "game_end",
    SESSION_END = "session_end",


}


export enum ServerErrorEvents {

    FATAL_ERROR = "connexion_error",
    UNAVAILABLE_SESSION = "unnavailable_session",

    GAME_ERROR = "game_error",

}

