import { Controller, Param, HttpStatus, HttpCode, Get, Query } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { QueryBus } from 'src/core/infrastructure/cqrs/buses/query-bus';
import { GetDetailedReportQuery } from 'src/reports/application/queries/get-solo-attempt-report/attempt.report.query';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
// Helpers & Guards
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';
import { GetDetailedHostReportQuery } from 'src/reports/application/queries/get-host-session-report/host-session-report.query';
import { GetDetailedPlayerReportQuery } from 'src/reports/application/queries/get-player-session-report/player-session-report.query';
import { PaginationDto } from 'src/library/infrastructure/nestjs/dtos/pagination.dto';
import { GetPlayedKahootListQuery } from 'src/reports/application/queries/get-played-kahoot-list/played-kahoot-list.query';

@Controller('reports')
export class ReportsController {

    constructor(
      private readonly queryBus: QueryBus,
      private readonly executor: CommandQueryExecutorService,
    ) {}


  // This endpoint provides a detailed breakdown of a completed solo attempt,
  // showing performance on each individual question for personal review
  @Get('singleplayer/:attemptId')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getSinglePlayerDetailedReport(@GetUserId() userId: string, @Param('attemptId') attemptId: string) {
    try {
      // We execute the query to fetch the detailed report from the database
      return await this.queryBus.execute(
        new GetDetailedReportQuery(attemptId, userId)
      );
    } catch (error) {
      const errorMessage = (error as Error).message;

      // We map domain error codes to appropriate HTTP exceptions for clear client feedback
      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND)) {
        throw new BadRequestException('A completed attempt with the specified ID was not found');
      }

      if (errorMessage.startsWith(ATTEMPT_ERROR_CODES.UNAUTHORIZED_ATTEMPT_ACCESS)) {
        throw new UnauthorizedException('You do not have permission to view this report');
      }

      // For any unhandled errors, we let NestJS handle them with its default error handling
      throw error;
    }
  }


  @Get('sessions/:sessionId')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getMultiplayerSessionHostDetailedReport(@GetUserId() userId: string, @Param('sessionId') sessionId: string) {

    return await this.executor.executeQuery( new GetDetailedHostReportQuery( sessionId, userId ));

  }


  @Get('multiplayer/:sessionId')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getMultiplayerSessionPlayerDetailedReport(@GetUserId() userId: string, @Param('sessionId') sessionId: string) {

    return await this.executor.executeQuery( new GetDetailedPlayerReportQuery( sessionId, userId ));

  }


  @Get('kahoots/my-results')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getPlayedKahootResults(@GetUserId() userId: string, @Query() paginationDto: PaginationDto ) {

    const { limit, page } = paginationDto

    return await this.executor.executeQuery( new GetPlayedKahootListQuery( userId, limit, page ));

  }





}
