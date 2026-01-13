import { applyDecorators, UseGuards } from '@nestjs/common';
import { SessionRoles } from '../enums/session-roles.enum';
import { MultiplayerSessionRoles } from './session-roles.decorator';
import { SessionRoleGuard } from '../guards/session-role.guard';


export function AuthSession(...roles: SessionRoles[]) {
  return applyDecorators(
    MultiplayerSessionRoles(...roles), // Seteamos los roles
    UseGuards(SessionRoleGuard), // Ejecutamos el Guard del handler
  );
}