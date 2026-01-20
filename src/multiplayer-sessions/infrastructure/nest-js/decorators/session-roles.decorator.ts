import { SetMetadata } from '@nestjs/common';
import { SessionRoles } from '../enums/session-roles.enum';

export const ROLES_KEY = 'roles';
export const MultiplayerSessionRoles = (...roles: SessionRoles[]) => SetMetadata(ROLES_KEY, roles);