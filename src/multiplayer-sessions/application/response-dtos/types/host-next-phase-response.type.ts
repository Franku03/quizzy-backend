import { QuestionStartedResponse } from "../question-started.response.dto";
import { QuestionResultsResponse } from "../question-results.response.dto";
import { GameEndedResponse } from "../game-ended.response.dto";

export type HostNextPhaseResponse = QuestionStartedResponse | QuestionResultsResponse | GameEndedResponse;
