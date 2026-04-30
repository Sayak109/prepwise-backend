import {
  IsBooleanString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Difficulty, QuestionType } from '@prisma/client';

export class QuestionQueryDto {
  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  topicId?: string;

  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsBooleanString()
  @IsOptional()
  isPremium?: string;
}
