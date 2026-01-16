/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\queries\read-model\user.read.model.ts

// El read model es la respuesta que retorna el QueryHandler despues de consultar
// la base de datos. Se puede dar el caso de que dos queries retornen el mismo
// read model o al menos una variacion del mismo, por eso tienen su carpeta
// separada
export class UserReadModel {
  constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly username: string,
      public readonly isPremium: boolean,
  ) {}
}
