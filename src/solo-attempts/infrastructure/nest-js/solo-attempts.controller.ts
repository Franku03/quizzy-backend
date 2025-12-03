import { Body, Controller, Post, Req, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { StartSoloAttemptCommand } from 'src/solo-attempts/application/commands/start-attempt/start-attempt.command';
// import { JwtAuthGuard } from 'src/auth/infrastructure/guards/jwt-auth.guard';

@Controller('attempts')
export class SoloAttemptsController {
  constructor(private readonly commandBus: CommandBus) {}

  // This endpoint starts a new Single Player Session.
  // It corresponds to the POST /attempts specification in the API docs.
  // @UseGuards(JwtAuthGuard) 
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async startAttempt(@Body('kahootId') kahootId: string, @Req() req: any) {
    // We extract the authenticated user's ID from the request object.
    //const userId = req.user?.id; 
    const userId = crypto.randomUUID(); // Temporary user ID for testing without authentication

    // We execute the command and return the result directly.
    // The handler returns { attemptId, firstSlide } which matches the API response.
    return await this.commandBus.execute(
      new StartSoloAttemptCommand(userId, kahootId),
    );
  }
}