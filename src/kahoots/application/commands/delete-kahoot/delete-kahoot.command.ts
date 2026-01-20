/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\delete-kahoot\delete-kahoot.command.ts

import { ICommand } from 'src/core/application/cqrs/command.interface';

interface DeleteCommandProps {
  id: string;
  userId: string;
}

export class DeleteKahootCommand implements ICommand {
  public readonly kahootId: string;
  public readonly userId: string;

  constructor(props: DeleteCommandProps) {
    this.kahootId = props.id;
    this.userId = props.userId;
  }
}