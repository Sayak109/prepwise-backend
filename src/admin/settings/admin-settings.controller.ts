import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Req, Put, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { AdminSettingsService } from './admin-settings.service';
import { encryptData } from '@/common/helper/common.helper';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role } from '@/enums/role.enum';
import { Roles } from '@/common/decorators/roles.decorator';
import { CommonDto } from '@/auth/dto/common.dto';

@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSettingsController {

  constructor(
    private readonly adminSettingsService: AdminSettingsService,
  ) { }

  @Post()
  async create(
    @Res() res: Response,
    @Body() createAdminSettingDto: CommonDto,
    @Req() req: Request,
  ) {
    try {
      const settings = await this.adminSettingsService.create(createAdminSettingDto);
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Settings created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to create admin settings.");
    }
  }

  @Get()
  async findAll(
    @Res() res: Response,
    @Query('setting') setting?: string,
  ) {
    try {
      const settings = await this.adminSettingsService.findAll(setting);
      const result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse(JSON.parse(result), "Settings."));
      return res.status(HttpStatus.OK).json({ data: resData });

    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read admin settings.");
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminSettingsService.findOne(+id);
  }


  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAdminSettingDto: CommonDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const settings = await this.adminSettingsService.update(id, updateAdminSettingDto);
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Settings updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update admin settings.");
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminSettingsService.remove(+id);
  }
}
