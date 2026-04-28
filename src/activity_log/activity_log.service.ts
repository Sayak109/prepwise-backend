import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateActivityLogDto } from './dto/create-activity_log.dto';
import { UpdateActivityLogDto } from './dto/update-activity_log.dto';
import { AdminActivityLogQueryDto } from './dto/admin-activity-log.query.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  create(createActivityLogDto: CreateActivityLogDto) {
    return 'This action adds a new activityLog';
  }

  async findAll(query: AdminActivityLogQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortOrder = 'desc',
        dateFrom,
        dateTo,
      } = query;

      const skip = (page - 1) * limit;

      /* ---------------- WHERE CLAUSE ---------------- */
      const where: any = {};

      /* ----- SEARCH (description OR action OR table) ----- */
      if (search) {
        where.OR = [
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            action: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            table: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      /* ----- DATE RANGE FILTER ----- */
      if (dateFrom || dateTo) {
        where.created_at = {};

        if (dateFrom) {
          where.created_at.gte = new Date(dateFrom);
        }

        if (dateTo) {
          // include entire day
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          where.created_at.lte = endDate;
        }
      }

      /* ---------------- QUERY ---------------- */
      const [data, total] = await this.prisma.$transaction([
        this.prisma.adminActivityLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: sortOrder,
          },
        }),
        this.prisma.adminActivityLog.count({ where }),
      ]);

      return {
        success: true,
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to fetch admin activity logs',
      );
    }
  }


  findOne(id: number) {
    return `This action returns a #${id} activityLog`;
  }

  update(id: number, updateActivityLogDto: UpdateActivityLogDto) {
    return `This action updates a #${id} activityLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} activityLog`;
  }
}
