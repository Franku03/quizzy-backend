import { CreateKahootCommand } from "../commands";
import { UpdateKahootCommand } from "../commands/update-kahoot/update-kahootcommand";

export interface IKahootRequestMapper<TCreate, TUpdate> {
    toCreateCommand(input: TCreate, userId: string): CreateKahootCommand;
    /*toUpdateCommand(input: TUpdate, id: string, userId: string): UpdateKahootCommand;*/
    toReplaceCommand(input: TUpdate, id: string, userId: string): UpdateKahootCommand
}