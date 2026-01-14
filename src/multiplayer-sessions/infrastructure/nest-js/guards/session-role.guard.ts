import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { SessionRoles } from '../enums/session-roles.enum';
import { ROLES_KEY } from '../decorators/session-roles.decorator';

@Injectable()
export class SessionRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const roomPin = client.data?.roomPin;
    const userRole = client.data?.role;

    // 1) Obtener los roles permitidos para este handler desde el decorador @Roles
    const requiredRoles = this.reflector.getAllAndOverride<SessionRoles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2) Validación de Sala (Transversal a cualquier evento de sesión)
    if (!roomPin || !client.rooms.has(roomPin)) {
      throw new WsException('FATAL: El cliente no se encuentra en la sala de la sesión');
    }

    // 3) Validación de Rol (Si el método tiene el decorador @Roles)
    if (requiredRoles) {
      if (!requiredRoles.includes(userRole)) {
        throw new WsException(`Acceso denegado: Se requiere rol ${requiredRoles.join(' o ')}`); // El join sobra pero quien sabe si a futuro se usa
      }
    }

    return true; // Si pasa todo, el handler se ejecuta
  }
}