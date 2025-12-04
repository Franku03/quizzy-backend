import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class MockAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const headerId = request.headers['x-mock-user-id'];


        const defaultUuid = '397b9a84-f851-417e-91da-fdfc271b1a81';

        if (!headerId && !defaultUuid) {
            throw new UnauthorizedException("Usuario no autenticado");
        }

        request.user = {
            id: headerId ? headerId : defaultUuid,
        };

        return true;
    }
}