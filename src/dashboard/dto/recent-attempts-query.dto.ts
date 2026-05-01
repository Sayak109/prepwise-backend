import { IsNumberString, IsOptional } from 'class-validator';

export class RecentAttemptsQueryDto {
  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}
