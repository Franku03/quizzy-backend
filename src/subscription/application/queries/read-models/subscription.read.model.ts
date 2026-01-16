/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\subscription\application\queries\read-models\subscription.read.model.ts

export class SubscriptionReadModel {
  constructor(
    public readonly userId: string,
    public readonly plan: string,
    public readonly status: string,
    public readonly expiresAt: string | null,
  ) {}
}