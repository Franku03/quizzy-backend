import { Body, Controller, Post, Param, Req, HttpStatus, HttpCode, Get, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { StartSoloAttemptCommand } from 'src/solo-attempts/application/commands/start-attempt/start-attempt.command';
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SubmissionMapper } from 'src/solo-attempts/application/commands/mappers/submission.mapper';
import { SubmitAnswerCommand } from 'src/solo-attempts/application/commands/submit-answer/submit-answer.command';
// import { JwtAuthGuard } from 'src/auth/infrastructure/guards/jwt-auth.guard';
import { SUBMIT_ANSWER_ERROR_CODES } from 'src/solo-attempts/application/commands/submit-answer/submit-answer.errors';
import { START_ATTEMPT_ERROR_CODES } from 'src/solo-attempts/application/commands/start-attempt/start-attempt.errors';
import { GET_SUMMARY_ERROR_CODES } from 'src/solo-attempts/application/queries/get-summary/get-summary.errors';
import { GetAttemptSummaryQuery } from 'src/solo-attempts/application/queries/get-summary/get-summary.query';
import { AttemptSummaryReadModel } from 'src/solo-attempts/application/queries/read-models/summary.attempt.read.model';

@Controller('attempts')
export class SoloAttemptsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
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

    // This endpoint retrieves the summary of a completed solo attempt
    // It corresponds to GET /attempts/:attemptId/summary in the API docs
    // The summary includes final score, total correct answers, and accuracy percentage
    // @UseGuards(JwtAuthGuard)
    @Get(':attemptId/summary')
    async getAttemptSummary(@Param('attemptId') attemptId: string) {
      try {
        // Execute the query to get the attempt summary
        // The query handler will return a summary if a completed attempt is found for that attempt ID
        const summary: AttemptSummaryReadModel = await this.queryBus.execute(
          new GetAttemptSummaryQuery(attemptId),
        );
        return summary;
      } 
      catch (error) {
        const errorMessage = (error as Error).message;

        // Map error codes to appropriate HTTP exceptions
        if (
          errorMessage.startsWith(GET_SUMMARY_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND)
        ) {
          throw new NotFoundException('Attempt not found or does not belong to user');
        }

        if (
          errorMessage.startsWith(GET_SUMMARY_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND)
        ) {
          throw new BadRequestException('Attempt has not been completed yet');
        }

        // For any other errors, throw a generic error
        throw error;
      }

    }


}   