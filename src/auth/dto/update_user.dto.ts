import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Role } from '@/common/enum/role.enum';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsInt()
  @IsOptional()
  countryId?: number;

  // 🔐 SAFER: role by name, not ID
  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
