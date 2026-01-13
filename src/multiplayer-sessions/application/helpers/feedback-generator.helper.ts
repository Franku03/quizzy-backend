/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\helpers\feedback-generator.helper.ts

export class FeedbackGenerator {

    private static correctMessages = [
        "¡Genial!", "¡Así se hace!", "¡Correcto!", "¡Sigue así!"
    ];

    private static streakMessages = [
        "¡ESTÁS EN LLAMAS! 🔥", "¡Imparable!", "¡Racha legendaria!", "¡Nadie te detiene!"
    ];

    private static wrongMessages = [
        "¡Ups! A la próxima.", "No te rindas.", "Estuvo cerca...", "¡Toca repasar conocimientos!"
    ];

    private static podioMessages = [
        "¡Estás en el TOP 3! 🏆", "¡Vas ganando!", "¡Estás cerca de la victoria!"
    ];

    public static noAnswerMessages = [
        "Esperando a la siguiente ronda...", "¡Quedaste afuera 😭!", "No desesperes, ¡en la siguiente remontarás!"
    ];

    /**
     * Genera un mensaje basado en el contexto del jugador
     */
    public static generate(context: {
        isCorrect: boolean;
        currentStreak: number;
        rank: number;
        score: number;
    }): string {
        const { isCorrect, currentStreak, rank } = context;

        // 1. Si falló, mensaje de consolación
        if (!isCorrect) {
            return this.getRandom(this.wrongMessages);
        }

        // 2. Si acertó, evaluamos prioridades de "emoción"
        
        // Prioridad A: Racha alta (Gamification pura: recompensar consistencia)
        if (currentStreak >= 3) {
            return `${this.getRandom(this.streakMessages)} (Racha de ${currentStreak})`;
        }

        // Prioridad B: Está en el podio (Top 3)
        if (rank <= 3 && rank > 0) {
            return this.getRandom(this.podioMessages);
        }

        // Prioridad C: Acierto estándar
        return this.getRandom(this.correctMessages);
    }

    // Helper para sacar frases aleatorias y que no sea repetitivo
    private static getRandom(messages: string[]): string {
        const randomIndex = Math.floor(Math.random() * messages.length);
        return messages[randomIndex];
    }
}