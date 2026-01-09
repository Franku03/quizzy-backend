/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\update-kahoot\update-kahoot.command.ts

import { BaseKahootCommand } from "../base/base-kahoot.command";
import { KahootSlideCommand } from "../base/base-kahoot-slide.command";

// Interfaz que define las propiedades que el Command puede aceptar
interface UpdateCommandProps {
    userId: string;
    id: string;
    title?: string;
    description?: string;
    imageId?: string;
    themeId: string;
    category?: string;
    visibility: string;
    status: string;
    slides?: KahootSlideCommand[];
}

export class UpdateKahootCommand extends BaseKahootCommand {
    public readonly id: string; 
    constructor(props: UpdateCommandProps) {
        super(props); 
        this.id = props.id;
    }
}