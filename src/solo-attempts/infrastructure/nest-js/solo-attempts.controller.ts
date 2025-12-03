import { Body, Controller, Post, Param, Req, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { StartSoloAttemptCommand } from 'src/solo-attempts/application/commands/start-attempt/start-attempt.command';
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SubmissionMapper } from 'src/solo-attempts/application/mappers/submission.mapper';
import { SubmitAnswerCommand } from 'src/solo-attempts/application/commands/submit-answer/submit-answer.command';
// import { JwtAuthGuard } from 'src/auth/infrastructure/guards/jwt-auth.guard';
import { SUBMIT_ANSWER_ERROR_CODES } from 'src/solo-attempts/application/commands/submit-answer/submit-answer.errors';
import { START_ATTEMPT_ERROR_CODES } from 'src/solo-attempts/application/commands/start-attempt/start-attempt.errors';

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
      if (errorMessage.startsWith(START_ATTEMPT_ERROR_CODES.KAHOOT_NOT_FOUND)) {
        throw new NotFoundException('The specified Kahoot does not exist');
      }
      
      if (errorMessage.startsWith(START_ATTEMPT_ERROR_CODES.DRAFT_KAHOOT)) {
        throw new BadRequestException('Cannot start attempt on a draft Kahoot');
      }
      
      if (errorMessage.startsWith(START_ATTEMPT_ERROR_CODES.NO_SLIDES)) {
        throw new BadRequestException('The Kahoot has no slides to play');
      }

      // Si es un BadRequestException de Nest (de validación de entrada), re-lanzarlo
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw error; // throw unhandled error
    }
  }


  // This endpoint submits an answer for a specific attempt.
  // It corresponds to the POST /attempts/:attemptId/answer specification in the API docs.
  @Post(':attemptId/answer')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() body: any,
    @Req() req: any
  ) {
    try {
      const userId = crypto.randomUUID(); // Temporary user ID for testing
      
      // Validate request body using the mapper's validation helper
      const validation = SubmissionMapper.validateRequestData(
        body.slideId,
        body.answerIndex,
        body.timeElapsedSeconds
      );
      
      if (!validation.isValid) {
        throw new BadRequestException(validation.error);
      }

      // Execute the command with all necessary data
      return await this.commandBus.execute(
        new SubmitAnswerCommand(
          attemptId,
          userId,
          body.slideId,
          body.answerIndex,
          body.timeElapsedSeconds
        )
      );
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.startsWith(SUBMIT_ANSWER_ERROR_CODES.ATTEMPT_NOT_FOUND)) {
        throw new NotFoundException('The specified attempt does not exist');
      }
      
      if (errorMessage.startsWith(SUBMIT_ANSWER_ERROR_CODES.UNAUTHORIZED_ATTEMPT_ACCESS)) {
        throw new BadRequestException('You do not have access to this attempt');
      }
      
      if (errorMessage.startsWith(SUBMIT_ANSWER_ERROR_CODES.ATTEMPT_NOT_IN_PROGRESS)) {
        throw new BadRequestException('This attempt is not in progress');
      }
      
      if (errorMessage.startsWith(SUBMIT_ANSWER_ERROR_CODES.KAHOOT_NOT_FOUND)) {
        throw new NotFoundException('The Kahoot for this attempt no longer exists');
      }
      
      if (errorMessage.startsWith(SUBMIT_ANSWER_ERROR_CODES.SLIDE_ALREADY_ANSWERED)) {
        throw new BadRequestException('This slide has already been answered');
      }
      
      if (errorMessage.startsWith(SUBMIT_ANSWER_ERROR_CODES.INVALID_SUBMISSION)) {
        throw new BadRequestException('Invalid submission data');
      }
      
      if (errorMessage.startsWith(SUBMIT_ANSWER_ERROR_CODES.NO_NEXT_SLIDE)) {
        // This is actually expected when the game is completed
        // The handler will return nextSlide as null in this case
      }

      throw error;
    }
    }
}   