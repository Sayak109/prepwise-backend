import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { Status, UserRole } from '@prisma/client';

export class UserQueryDto {
  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
