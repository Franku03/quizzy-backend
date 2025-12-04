import { Body, Controller, Post, Param, Req, HttpStatus, HttpCode, Get, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';

@Controller('reports')
export class ReportsController {
    constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
}
