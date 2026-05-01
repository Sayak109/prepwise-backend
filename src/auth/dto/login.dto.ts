import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  recaptchaToken: string;
}

export class refreshDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
