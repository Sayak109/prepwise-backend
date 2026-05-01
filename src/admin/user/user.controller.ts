import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { Role } from '@/common/enum/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ApiResponse } from '@/common/helper/response.helper';
import { UpdateEditorDto } from './dto/update-editor.dto';
import { UpdateEditorPermissionsDto } from './dto/update-editor-permissions.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserService } from './user.service';
import { CreateEditorDto } from './dto/create-editor.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller({ path: '', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Query() query: UserQueryDto, @Res() res: Response) {
    try {
      const users = await this.userService.findAll(query);
      const result = JSON.stringify(users, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          new ApiResponse(JSON.parse(result), 'Users fetched successfully.'),
        );
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Post()
  async createEditor(
    @Body() dto: CreateEditorDto,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const editor = await this.userService.createEditor(dto, currentUser);
      const result = JSON.stringify(editor, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res
        .status(HttpStatus.CREATED)
        .json(
          new ApiResponse(JSON.parse(result), 'Editor created successfully.'),
        );
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  async updateEditor(
    @Param('id') editorId: string,
    @Body() dto: UpdateEditorDto,
    @Res() res: Response,
  ) {
    try {
      const editor = await this.userService.updateEditor(editorId, dto);
      const result = JSON.stringify(editor, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          new ApiResponse(JSON.parse(result), 'Editor updated successfully.'),
        );
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id/permissions')
  async getEditorPermissions(
    @Param('id') editorId: string,
    @Res() res: Response,
  ) {
    try {
      const permissions = await this.userService.getEditorPermissions(editorId);
      const result = JSON.stringify(permissions, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          new ApiResponse(
            JSON.parse(result),
            'Editor permissions fetched successfully.',
          ),
        );
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put(':id/permissions')
  async updateEditorPermissions(
    @Param('id') editorId: string,
    @Body() dto: UpdateEditorPermissionsDto,
    @GetUser() currentUser: any,
    @Res() res: Response,
  ) {
    try {
      const permissions = await this.userService.updateEditorPermissions(
        editorId,
        dto,
        currentUser,
      );
      const result = JSON.stringify(permissions, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          new ApiResponse(
            JSON.parse(result),
            'Editor permissions updated successfully.',
          ),
        );
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
