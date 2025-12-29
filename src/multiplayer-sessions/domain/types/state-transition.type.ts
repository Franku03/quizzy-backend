// objeto discriminado (Discriminated Union) que dice exactamente qué sucedió al avanzar de fase en la partida

export enum StateTransitionsTypes {
    TRANSITION_TO_QUESTION = "transition_to_question",
    TRANSITION_TO_RESULTS = "transition_to_results",
    TRANSITION_TO_END = "transition_to_end",
}

export type StateTransition = 
    { 
        state: StateTransitionsTypes
    }
