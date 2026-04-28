import { IsString } from 'class-validator';

export class CommonDto {
  @IsString()
  data: string;

  [key: string]: unknown;
}
