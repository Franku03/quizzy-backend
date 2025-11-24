export interface ICommandService<TCommand> {
    execute( command:TCommand) : void
}