import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
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
import { DashboardService } from './dashboard.service';
import { RecentAttemptsQueryDto } from './dto/recent-attempts-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@GetUser() currentUser: any, @Res() res: Response) {
    try {
      const dashboard = await this.dashboardService.getDashboard(currentUser);
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(dashboard, 'Dashboard fetched successfully.'));
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }

  @Get('recent-attempts')
  async getAttemptHistory(
    @GetUser() currentUser: any,
    @Query() query: RecentAttemptsQueryDto,
    @Res() res: Response,
  ) {
    try {
      const attempts = await this.dashboardService.getAttemptHistory(
        currentUser,
        query,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          new ApiResponse(attempts, 'Attempt history fetched successfully.'),
        );
    } catch (error: any) {
      throw new BadRequestException(error.response ?? error.message);
    }
  }
}
