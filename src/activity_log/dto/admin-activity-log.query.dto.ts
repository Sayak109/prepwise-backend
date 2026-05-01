import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminActivityLogQueryDto {
  /* ---------------- PAGINATION ---------------- */

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  /* ---------------- SEARCH ---------------- */
  // search on description, action, table
  @IsOptional()
  @IsString()
  search?: string;

  /* ---------------- SORT ---------------- */
  // only for created_at
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  /* ---------------- DATE RANGE ---------------- */

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
