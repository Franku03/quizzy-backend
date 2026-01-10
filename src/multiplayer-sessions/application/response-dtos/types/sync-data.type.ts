import { HostEndGameResponse, PlayerEndGameResponse } from "../game-ended.response.dto";
import { HostLobbyUpdateResponse, LobbyStateUpdateResponse, PlayerLobbyUpdateResponse,  } from "../lobby-state-update.response.dto";
import { QuestionResultsHostResponse, QuestionResultsPlayerResponse } from "../question-results.response.dto";
import { QuestionStartedResponse } from "../question-started.response.dto";


export type SyncData = 
    QuestionStartedResponse 
    | QuestionResultsHostResponse | QuestionResultsPlayerResponse
    | HostEndGameResponse | PlayerEndGameResponse
    | LobbyStateUpdateResponse | HostLobbyUpdateResponse | PlayerLobbyUpdateResponse;