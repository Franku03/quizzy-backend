import { Body, Controller, Post, Param, Req, HttpStatus, HttpCode, Get, UseGuards } from '@nestjs/common';
import { CommandBus } from 'src/core/infrastructure/cqrs/buses/command-bus';
import { QueryBus } from 'src/core/infrastructure/cqrs/buses/query-bus';import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GetDetailedReportQuery } from 'src/reports/application/queries/get-solo-attempt-report/attempt.report.query';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
import { Headers } from '@nestjs/common';
// Helpers & Guards
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';

@Controller('reports')
export class ReportsController {
    constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}


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



}
