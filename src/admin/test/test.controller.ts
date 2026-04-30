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
import { CreateTestDto } from './dto/create-test.dto';
import { TestQueryDto } from './dto/test-query.dto';
import { UpdateTestQuestionsDto } from './dto/update-test-questions.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { AdminTestService } from './test.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller({ path: '', version: '1' })
export class AdminTestController {
  constructor(private readonly testService: AdminTestService) {}

  @Post()
  async create(
    @Body() dto: CreateTestDto,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const test = await this.testService.create(dto, currentUser);
      return res
        .status(HttpStatus.CREATED)
        .json(new ApiResponse(test, 'Test created successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get()
  async findAll(@Query() query: TestQueryDto, @Res() res: Response) {
    try {
      const tests = await this.testService.findAll(query);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(tests, 'Tests fetched successfully.'));
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

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTestDto,
    @Res() res: Response,
  ) {
    try {
      const test = await this.testService.update(id, dto);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(test, 'Test updated successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Patch(':id/questions')
  async updateQuestions(
    @Param('id') id: string,
    @Body() dto: UpdateTestQuestionsDto,
    @Res() res: Response,
  ) {
    try {
      const test = await this.testService.updateQuestions(id, dto);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(test, 'Test questions updated successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const test = await this.testService.remove(id);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(test, 'Test deleted successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }
}
