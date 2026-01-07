import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const GetUserId = createParamDecorator(
    (_data: unknown, context: ExecutionContext) => {

        const request = context.switchToHttp().getRequest();

        if  ( ! request.user || !request.user.id )  {
            throw new InternalServerErrorException(
                'El id del usuario no se encuentra dentro de la petición - (GetUserId decorator was used without an AuthGuard (or MockAuthGuard).)'
            );
        }

        // console.log(`User ID: ${request.user.id}`);
        return request.user.id;
    }
);