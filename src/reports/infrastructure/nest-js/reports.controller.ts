import { Body, Controller, Post, Param, Req, HttpStatus, HttpCode, Get, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GET_DETAILED_REPORT_ERROR_CODES } from 'src/reports/application/queries/get-solo-attempt-report/attempt.report.errors';
import { AttemptReportReadModel } from 'src/reports/application/queries/read-models/solo.attempt.report.read.model';
import { GetDetailedReportQuery } from 'src/reports/application/queries/get-solo-attempt-report/attempt.report.query';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';

@Controller('reports')
export class ReportsController {
    constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}


  // This endpoint provides a detailed breakdown of a completed solo attempt,
  // showing performance on each individual question for personal review
  // @UseGuards(JwtAuthGuard)
  @Get('singleplayer/:attemptId')
  async getSinglePlayerDetailedReport(@Param('attemptId') attemptId: string) {
    try {
      // We execute the query to fetch the detailed report from the database
      return await this.queryBus.execute(
        new GetDetailedReportQuery(attemptId)
      );
    } catch (error) {
      const errorMessage = (error as Error).message;

      // We map domain error codes to appropriate HTTP exceptions for clear client feedback
      if (errorMessage.startsWith(GET_DETAILED_REPORT_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND)) {
        throw new BadRequestException('A completed attempt with the specified ID was not found');
      }

      if (errorMessage.startsWith(GET_DETAILED_REPORT_ERROR_CODES.UNAUTHORIZED_ACCESS)) {
        throw new UnauthorizedException('You do not have permission to view this report');
      }

      // For any unhandled errors, we let NestJS handle them with its default error handling
      throw error;
    }
  }



}
