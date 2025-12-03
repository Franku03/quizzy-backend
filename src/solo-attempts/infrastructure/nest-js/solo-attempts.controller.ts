import { Body, Controller, Post, Req, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { StartSoloAttemptCommand } from 'src/solo-attempts/application/commands/start-attempt/start-attempt.command';
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
// import { JwtAuthGuard } from 'src/auth/infrastructure/guards/jwt-auth.guard';

const ERROR_CODES = {
  KAHOOT_NOT_FOUND: 'KAHOOT_NOT_FOUND',
  DRAFT_KAHOOT: 'DRAFT_KAHOOT',
  NO_SLIDES: 'NO_SLIDES',
  INVALID_ID: 'INVALID_ID',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EVENT_BUS_ERROR: 'EVENT_BUS_ERROR',
} as const;

@Controller('attempts')
export class SoloAttemptsController {
  constructor(private readonly commandBus: CommandBus) {}

  // This endpoint starts a new Single Player Session.
  // It corresponds to the POST /attempts specification in the API docs.
  // @UseGuards(JwtAuthGuard) 
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async startAttempt(@Body('kahootId') kahootId: string, @Req() req: any) {
    try {
         // We extract the authenticated user's ID from the request object.
        //const userId = req.user?.id; 
        const userId = crypto.randomUUID(); // Temporary user ID for testing without authentication

        // We execute the command and return the result directly.
        // The handler returns { attemptId, firstSlide } which matches the API response.
        return await this.commandBus.execute(
        new StartSoloAttemptCommand(userId, kahootId),
        );
    } catch (error) {

      const errorMessage = (error as Error).message;

      // Mapeo de códigos de error a excepciones HTTP
      if (errorMessage.startsWith(ERROR_CODES.KAHOOT_NOT_FOUND)) {
        throw new NotFoundException('The specified Kahoot does not exist');
      }
      
      if (errorMessage.startsWith(ERROR_CODES.DRAFT_KAHOOT)) {
        throw new BadRequestException('Cannot start attempt on a draft Kahoot');
      }
      
      if (errorMessage.startsWith(ERROR_CODES.NO_SLIDES)) {
        throw new BadRequestException('The Kahoot has no slides to play');
      }

      // Si es un BadRequestException de Nest (de validación de entrada), re-lanzarlo
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to start attempt');
    }
  }
}   