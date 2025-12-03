// El read model es la respuesta que retorna el QueryHandler despues de consultar
// la base de datos. Se puede dar el caso de que dos queries retornen el mismo
// read model o al menos una variacion del mismo, por eso tienen su carpeta
// separada
export class UserReadModel {
  constructor(public readonly name: string) {}
}
