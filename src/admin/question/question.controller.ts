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
import { GetUser } from '@/common/decorators/get-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ApiResponse } from '@/common/helper/response.helper';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionService } from './question.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller({ path: '', version: '1' })
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async create(
    @Body() dto: CreateQuestionDto,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const question = await this.questionService.create(dto, currentUser);
      return res
        .status(HttpStatus.CREATED)
        .json(new ApiResponse(question, 'Question created successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get()
  async findAll(@Query() query: QuestionQueryDto, @Res() res: Response) {
    try {
      const questions = await this.questionService.findAll(query);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(questions, 'Questions fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const question = await this.questionService.findOne(id);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(question, 'Question fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const question = await this.questionService.update(id, dto, currentUser);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(question, 'Question updated successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const question = await this.questionService.remove(id);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(question, 'Question deleted successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }
}
