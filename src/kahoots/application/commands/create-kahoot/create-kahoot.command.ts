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