import { IsNotEmpty, IsString } from 'class-validator';

export class resetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  new_password: string;
}
