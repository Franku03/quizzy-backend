/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\queries\get-user-profile\get-user-profile.query.ts

import { IQuery } from "src/core/application/cqrs/query.interface";

export class GetUserProfileQuery implements IQuery {
  public readonly userId: string;
  public readonly targetUserId: string;

  constructor(props: { userId: string; targetUserId: string }) {
      Object.assign(this, props);
  }
}