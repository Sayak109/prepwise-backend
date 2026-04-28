import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpStatus, Res, BadRequestException } from '@nestjs/common';
import { ActivityLogService } from './activity_log.service';
import { CreateActivityLogDto } from './dto/create-activity_log.dto';
import { UpdateActivityLogDto } from './dto/update-activity_log.dto';
import { AdminActivityLogQueryDto } from './dto/admin-activity-log.query.dto';
import { Role } from '@/common/enum/role.enum';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ApiResponse } from '@/common/helper/response.helper';
import type { Request, Response } from 'express';

@Controller({ path: 'admin/activity-log', version: '1' })
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) { }

  @Post()
  create(@Body() createActivityLogDto: CreateActivityLogDto) {
    return this.activityLogService.create(createActivityLogDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(@Query() query: AdminActivityLogQueryDto, @Res() res: Response,) {
    try {
      const eventres = await this.activityLogService.findAll(query);
      let result = JSON.stringify(eventres, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Activity log fetched successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
