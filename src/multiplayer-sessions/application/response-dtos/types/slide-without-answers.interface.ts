/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\types\slide-without-answers.interface.ts

import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";

export interface OptionSnapshotWithoutAnswers {
    index: string;
    text?: string;
    mediaURL?: string; 
}

export interface SlideSnapshotWithoutAnswers {
    id: string;
    position: number;
    slideType: SlideTypeEnum; 
    timeLimitSeconds: number; 
    //Opcionales
    questionText?: string; 
    slideImageURL?: string; 
    pointsValue?: number; 
    descriptionText?: string; 
    options?: OptionSnapshotWithoutAnswers[]; 
}