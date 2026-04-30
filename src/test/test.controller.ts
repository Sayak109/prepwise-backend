import {
  BadRequestException,
  Body,
  Controller,
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
import { GetUser } from '@/common/decorators/get-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ApiResponse } from '@/common/helper/response.helper';
import { FlagTestQuestionDto } from './dto/flag-test-question.dto';
import { SaveTestAnswerDto } from './dto/save-test-answer.dto';
import { StudentTestQueryDto } from './dto/test-query.dto';
import { TestService } from './test.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller({ path: 'test', version: '1' })
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  async findAll(@Query() query: StudentTestQueryDto, @Res() res: Response) {
    try {
      const tests = await this.testService.findAll(query);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(tests, 'Tests fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get('attempts/:attemptId')
  async getAttempt(
    @Param('attemptId') attemptId: string,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const attempt = await this.testService.getAttempt(attemptId, currentUser);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(attempt, 'Test attempt fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const test = await this.testService.findOne(id);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(test, 'Test fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Post(':id/start')
  async start(
    @Param('id') id: string,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const attempt = await this.testService.start(id, currentUser);
      return res
        .status(HttpStatus.CREATED)
        .json(new ApiResponse(attempt, 'Test started successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Patch('attempts/:attemptId/questions/:questionId/visit')
  async visitQuestion(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const attempt = await this.testService.visitQuestion(
        attemptId,
        questionId,
        currentUser,
      );
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(attempt, 'Question visited successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Patch('attempts/:attemptId/questions/:questionId/flag')
  async flagQuestion(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() dto: FlagTestQuestionDto,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const attempt = await this.testService.flagQuestion(
        attemptId,
        questionId,
        dto,
        currentUser,
      );
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(attempt, 'Question flag updated successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Patch('attempts/:attemptId/questions/:questionId/answer')
  async saveAnswer(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() dto: SaveTestAnswerDto,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const attempt = await this.testService.saveAnswer(
        attemptId,
        questionId,
        dto,
        currentUser,
      );
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(attempt, 'Answer saved successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Post('attempts/:attemptId/complete')
  async complete(
    @Param('attemptId') attemptId: string,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const attempt = await this.testService.complete(attemptId, currentUser);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(attempt, 'Test completed successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }
}
