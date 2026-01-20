/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\types\state-transition.type.ts

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
