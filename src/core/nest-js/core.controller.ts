/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\nest-js\core.controller.ts

import { Controller, Get } from '@nestjs/common';

@Controller()
export class CoreController { 
  @Get()
  getStatus(): { 
    status: string; 
    message: string; 
    timestamp: string;
    developer_note: string;
    current_mood: string;
    team_status: string;
    architecture_snapshot: {
      patterns: string[];
      experts_mentioned: string[];
      coffee_level: string;
    };
  } {
    // Diferentes mensajes aleatorios cada vez que se recarga
    const messages = [
      "🚀 ¡El core está despegando! (Bueno, intentándolo al menos...)",
      "⚡ ¡Energía DDD a tope! Los agregados están más contentos que unos gusanos en una manzana",
      "🧠 Nuestro hexágono está tan ocupado que parece un panal de abejas con café",
      "🔧 'Arreglando' cosas que no estaban rotas desde 2025",
      "💫 Si los módulos fueran pizza, tendríamos una con extra de cheese... y olvidamos la masa",
      "🎯 Objetivo: Hacer que funcione. Método: Trial, error, y mucho Ctrl+C/Ctrl+V",
      "🧪 Los tests están en huelga, piden mejores aserciones y menos expectativas irreales",
      "📚 Leyendo 'Dependency Injection para Dummies' por tercera vez esta semana",
      "🎪 Bienvenido al circo de los módulos, donde los imports hacen magia... o desastre",
      "🎭 **AOP en acción**: 'Cross-cutting concerns' cortando más que preocupaciones... ¡cortando nuestra sanidad mental!",
      "🏗️ **Scott Millett sonríe**: Si la arquitectura fuera un edificio, tendríamos ascensores que solo funcionan los martes",
      "🧠 **Eric Evans en modo espectador**: Nuestro lenguaje ubicuo incluye nuevas palabras como 'dependencyhell' y 'modulitis'",
    ];

    const moods = [
      "😅 'Funciona en local'",
      "🤯 Lidiando con inyección de dependencias",
      "☕ Nivel de café: Sobredosis",
      "🔄 Recompilando... por decimotercera vez",
      "🐛 Cazando bugs fantasma",
      "🎪 En modo 'funciona, no toques nada'",
      "🔮 Adivinando qué quiere decir este error de NestJS",
      "🏗️ 'La arquitectura está perfecta' (miente descaradamente)",
      "📚 Leyendo a Mark Seeman mientras lloro",
    ];

    const teamActivities = [
      "Luchando valientemente contra los demonios de la inyección de dependencias",
      "Debatiendo si esa interfaz debería ser un tipo o una clase abstracta",
      "Buscando el ';' perdido que rompe todo el build",
      "Tomando café mientras TypeScript se queja por enésima vez",
      "Rezando para que el CI pase esta vez",
      "Actualizando dependencias y cruzando los dedos",
      "Implementando patrones que entendimos a medis",
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const randomTeamActivity = teamActivities[Math.floor(Math.random() * teamActivities.length)];

    return {
      status: 'IN-PROGRESS',
      message: randomMessage,
      timestamp: new Date().toISOString(),
      developer_note: '⚠️ El equipo está actualmente en modo: "¿Por qué esto compila pero no funciona?"',
      current_mood: randomMood,
      team_status: `Franklin, Kufatty, Monroy, Ochoa, Santiago, Sergio: ${randomTeamActivity}`,
      architecture_snapshot: {
        patterns: ['Repository (funciona)', 'Factory (a veces)', 'Singleton (el café)', 'Strategy (ignorar errores)'],
        experts_mentioned: ['Mark Seeman (DI)', 'Scott Millett (Patrones)', 'Eric Evans (DDD)'],
        coffee_level: Math.random() > 0.5 ? 'Enough to power a small city' : 'Critical levels, send help',
      }
    };
  }
}