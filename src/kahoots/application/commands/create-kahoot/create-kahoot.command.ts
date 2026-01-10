/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\create-kahoot\create-kahoot.command.ts

import { BaseKahootCommand } from "../base/base-kahoot.command";
import { KahootSlideCommand } from "../base/base-kahoot-slide.command";

interface CreateCommandProps {
    userId: string;
    themeId: string;
    visibility: string;
    status: string;
    title?: string;
    description?: string;
    imageId?: string;
    category?: string;
    slides?: KahootSlideCommand[];
}

export class CreateKahootCommand extends BaseKahootCommand {
    constructor(props: CreateCommandProps) {
        super(props); 
    }
}