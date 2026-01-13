/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\helpers\map-payload-to-player.helper.ts

import { QuestionResultsPlayerResponse, QuestionResultsResponse } from "../response-dtos";

export const mapPayloadToPlayer = ( fullResponse: QuestionResultsResponse, playerId: string ): QuestionResultsPlayerResponse => {
    
    // 1) Buscamos los datos específicos de este jugador en el mapa
    const specificData = fullResponse.playerData.get( playerId );

    // 2) Manejo de caso borde: "Jugador Fantasma"
    // Si por alguna razón el ID del socket no está en el mapa de resultados 
    // (ej: se reconectó justo en el milisegundo de transición o es un espectador bugueado)
    if (!specificData) {
        // Devolvemos un objeto "vacío" o seguro para evitar que el front explote
        return {
            state: fullResponse.hostData.state,
            isCorrect: false,
            pointsEarned: 0,
            totalScore: 0, // O buscar su score en otro lado si fuera crítico
            rank: 0,
            previousRank: 0,
            streak: 0,
            message: "Esperando siguiente ronda...",
            correctAnswerIds: fullResponse.hostData.correctAnswerId, // Aún así le mostramos la correcta
            progress: {
                current: fullResponse.hostData.progress.current,
                total: fullResponse.hostData.progress.total,
            }
        };

    }

    // 3. Construimos el payload final combinando datos
    return specificData ;
}