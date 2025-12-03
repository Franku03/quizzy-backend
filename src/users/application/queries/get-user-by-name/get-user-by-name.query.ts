// el query se envia al queryBus y este se lo hace llegar al query handler

// src/application/queries/get-user-by-id.query.ts
export class GetUserByNameQuery {
  // Los parámetros que necesita la consulta
  constructor(public readonly userName: string) {}
}
