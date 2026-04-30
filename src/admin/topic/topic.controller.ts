import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ApiResponse } from '@/common/helper/response.helper';
import { CreateTopicDto } from './dto/create-topic.dto';
import { TopicQueryDto } from './dto/topic-query.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicService } from './topic.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller({ path: '', version: '1' })
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  async create(@Body() dto: CreateTopicDto, @Res() res: Response) {
    try {
      const topic = await this.topicService.create(dto);
      return res
        .status(HttpStatus.CREATED)
        .json(new ApiResponse(topic, 'Topic created successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get()
  async findAll(@Query() query: TopicQueryDto, @Res() res: Response) {
    try {
      const topics = await this.topicService.findAll(query);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(topics, 'Topics fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const topic = await this.topicService.findOne(id);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(topic, 'Topic fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
    @Res() res: Response,
  ) {
    try {
      const topic = await this.topicService.update(id, dto);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(topic, 'Topic updated successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const topic = await this.topicService.remove(id);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(topic, 'Topic deleted successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }
}
