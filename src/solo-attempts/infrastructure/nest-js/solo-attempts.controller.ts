import { Body, Controller, Post, Param, Req, HttpStatus, HttpCode, Get } from '@nestjs/common';
import { CommandBus } from 'src/core/infrastructure/cqrs/buses/command-bus';
import { QueryBus } from 'src/core/infrastructure/cqrs/buses/query-bus';
import { StartSoloAttemptCommand } from 'src/solo-attempts/application/commands/start-attempt/start-attempt.command';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubmissionMapper } from 'src/solo-attempts/application/commands/mappers/submission.mapper';
import { SubmitAnswerCommand } from 'src/solo-attempts/application/commands/submit-answer/submit-answer.command';
// import { JwtAuthGuard } from 'src/auth/infrastructure/guards/jwt-auth.guard';
import { GetAttemptSummaryQuery } from 'src/solo-attempts/application/queries/get-summary/get-summary.query';
import { AttemptSummaryReadModel } from 'src/solo-attempts/application/queries/read-models/summary.attempt.read.model';
import { AttemptResumeReadModel } from 'src/solo-attempts/application/queries/read-models/resume.attempt.read.model';
import { GetAttemptStatusQuery } from 'src/solo-attempts/application/queries/get-attempt/get-attempt.query';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';

// Helpers & Guards
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';

@Controller('attempts')
export class SoloAttemptsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  
  // This endpoint starts a new Single Player Session.
  // It corresponds to the POST /attempts specification in the API docs.
  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async startAttempt(@GetUserId() userId: string, @Body('kahootId') kahootId: string) {
    try {
        // User module is not ready yet, so for testing we get userId from headers
        if (!userId) { 
          throw new BadRequestException('For testing purposes, a userId header is currently required (Manually inserted). The user module (Santiago) is not finished yet.');
        }
        // We extract the authenticated user's ID from the request object.
        //const userId = req.user?.id; 
        // We execute the command and return the result directly.
        // The handler returns { attemptId, firstSlide } which matches the API response.
        return await this.commandBus.execute(
        new StartSoloAttemptCommand(userId, kahootId),
        );
    } catch (error) {

      const errorMessage = (error as Error).message;

      // Mapeo de códigos de error a excepciones HTTP
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.KAHOOT_NOT_FOUND)) {
        throw new NotFoundException('The specified Kahoot does not exist');
      }
      
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.DRAFT_KAHOOT)) {
        throw new BadRequestException('Cannot start attempt on a draft Kahoot');
      }
      
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.NO_SLIDES)) {
        throw new BadRequestException('The Kahoot has no slides to play');
      }

      throw error; // throw unhandled error
    }
  }


  // This endpoint retrieves the current state of a singleplayer attempt
  // It allows the user to resume a paused game by returning the next slide
  // to answer if the attempt is still in progress
  @Get(':attemptId')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getResumeContext(@GetUserId() userId: string, @Param('attemptId') attemptId: string) {
    try {
      // We extract the authenticated user's ID from the request object
      // const userId = req.user?.id;
      
      // We execute the query to get the resume context
      // The query handler returns an Optional containing the AttemptResumeReadModel
      const attemptStatus: AttemptResumeReadModel =
        await this.queryBus.execute(
          new GetAttemptStatusQuery(attemptId, userId), 
        );
      return attemptStatus;
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Map error codes to HTTP exceptions
      if (errorMessage.includes(ATTEMPT_ERROR_CODES.ATTEMPT_NOT_FOUND)) {
        throw new NotFoundException('The specified attempt does not exist');
      }

      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.UNAUTHORIZED_ATTEMPT_ACCESS)) {
        throw new BadRequestException('You do not have permission to access this attempt');
      }

      throw error;
    }
  }


  // This endpoint submits an answer for a specific attempt.
  // It corresponds to the POST /attempts/:attemptId/answer specification in the API docs.
  @Post(':attemptId/answer')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @GetUserId() userId: string,
    @Param('attemptId') attemptId: string,
    @Body() body: any,
  ) {
    try {
      
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

      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.ATTEMPT_NOT_FOUND)) {
        throw new NotFoundException('The specified attempt does not exist');
      }
      
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.UNAUTHORIZED_ATTEMPT_ACCESS)) {
        throw new BadRequestException('You do not have permission to access this attempt');
      }
      
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.ATTEMPT_NOT_IN_PROGRESS)) {
        throw new BadRequestException('This attempt is not in progress');
      }
      
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.KAHOOT_NOT_FOUND)) {
        throw new NotFoundException('The Kahoot for this attempt no longer exists');
      }
      
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.SLIDE_ALREADY_ANSWERED)) {
        throw new BadRequestException('This slide has already been answered');
      }
      
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.INVALID_SUBMISSION)) {
        throw new BadRequestException('Invalid submission data');
      }

      throw error;
    }
    }

    // This endpoint retrieves the summary of a completed solo attempt
    // It corresponds to GET /attempts/:attemptId/summary in the API docs
    // The summary includes final score, total correct answers, and accuracy percentage
    @Get(':attemptId/summary')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async getAttemptSummary(@GetUserId() userId: string, @Param('attemptId') attemptId: string) {
      try {
        // Execute the query to get the attempt summary
        // The query handler will return a summary if a completed attempt is found for that attempt ID
        const summary: AttemptSummaryReadModel = await this.queryBus.execute(
          new GetAttemptSummaryQuery(attemptId, userId),
        );
        return summary;
      } 
      catch (error) {
        const errorMessage = (error as Error).message;

        // Map error codes to appropriate HTTP exceptions
        if (
          errorMessage.startsWith(ATTEMPT_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND)
        ) {
          throw new NotFoundException('There is not a completed attempt with the specified ID');
        }

        if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.UNAUTHORIZED_ATTEMPT_ACCESS)) {
          throw new BadRequestException('You do not have permission to access this attempt');
        }

        // For any other errors, throw a generic error
        throw error;
      }

    }


}   