import {
  IsBooleanString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { Difficulty, QuestionType } from '@prisma/client';

export class PracticeQuestionQueryDto {
  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  search?: string;

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
