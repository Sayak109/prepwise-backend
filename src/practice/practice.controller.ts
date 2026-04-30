import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Param,
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
import { PracticeQuestionQueryDto } from './dto/practice-question-query.dto';
import { PracticeTopicQueryDto } from './dto/practice-topic-query.dto';
import { PracticeService } from './practice.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller({ path: 'practice', version: '1' })
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('topics')
  async findTopics(
    @Query() query: PracticeTopicQueryDto,
    @Res() res: Response,
  ) {
    try {
      const topics = await this.practiceService.findTopics(query);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(topics, 'Practice topics fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get('topics/:topicId/questions')
  async findQuestionsByTopic(
    @Param('topicId') topicId: string,
    @Query() query: PracticeQuestionQueryDto,
    @Res() res: Response,
  ) {
    try {
      const questions = await this.practiceService.findQuestionsByTopic(
        topicId,
        query,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          new ApiResponse(
            questions,
            'Practice questions fetched successfully.',
          ),
        );
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get('topics/:topicId/start')
  async startTopicPractice(
    @Param('topicId') topicId: string,
    @Query() query: PracticeQuestionQueryDto,
    @Res() res: Response,
  ) {
    try {
      const practice = await this.practiceService.startTopicPractice(
        topicId,
        query,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          new ApiResponse(practice, 'Topic practice started successfully.'),
        );
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }
}
