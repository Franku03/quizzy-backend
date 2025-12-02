import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { CreateGroup } from 'src/groups/application/use-cases/create-group.use-case';
import { GetUserId } from 'src/common/decorators/get-user-id-decorator';
import type { CreateGroupDto } from 'src/groups/application/dtos/create-group.dto';
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';


@Controller('groups')
export class GroupsController {
    constructor(@Inject('CreateGroup') private readonly createGroup: CreateGroup) { }

    @Post()
    @UseGuards(MockAuthGuard)
    async create(
        @GetUserId() adminId: string,
        @Body() dto: CreateGroupDto,
    ) {
        await this.createGroup.execute({ ...dto, adminId });
        return { message: 'Group created successfully' };
    }
}
