import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @MaxLength(150)
  title: string;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;
}
