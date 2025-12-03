// Este es un ejemplo de un command. Se lo pasamos al commandBus
// para que este se lo envie al commandHandler y luego este ultimo
// realice la accion de base de datos que haga falta

export class CreateUserCommand {
  constructor(public readonly name: string) {}
}
