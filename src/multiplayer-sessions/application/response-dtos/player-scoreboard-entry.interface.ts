export interface PlayerScoreboardEntry {
    playerId: string
    nickname: string,
    score: number,            // Puntaje total acumulado
    rank: number,             // Posición actual (1, 2, 3...)
    previousRank: number,     // (Opcional) Para hacer un cambio de puesto (aunque ni sé si se usará aún)
}
