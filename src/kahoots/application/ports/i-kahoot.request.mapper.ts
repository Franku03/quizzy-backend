import { CreateKahootCommand } from "../commands";
import { UpdateKahootCommand } from "../commands/update-kahoot/update-kahootcommand";

export interface IKahootMapper<TCreate, TUpdate> {
    toCreateCommand(input: TCreate): CreateKahootCommand;
    toUpdateCommand(input: TUpdate, id: string): UpdateKahootCommand;
}