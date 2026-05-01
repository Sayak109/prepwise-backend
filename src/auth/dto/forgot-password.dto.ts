import { IsNotEmpty, IsString } from 'class-validator';

export class forgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}
