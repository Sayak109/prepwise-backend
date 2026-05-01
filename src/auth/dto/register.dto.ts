import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Role } from '@/common/enum/role.enum';

export class RegisterDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  // 🔐 SAFER: role by name, not ID
  @IsEnum(Role)
  role: Role;

  // Only SUPERADMIN can send this
  @IsOptional()
  @IsInt()
  countryId?: number;

  // 🔐 SAFER: status by name, not ID
  @IsOptional()
  status?: string;
}
