import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, QuestionType } from '@prisma/client';
import { QuestionOptionDto } from './question-option.dto';

export class CreateQuestionDto {
  @IsUUID()
  topicId: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  questionText: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsBoolean()
  @IsOptional()
  caseInsensitiveMatch?: boolean;

  @IsNumber()
  @IsOptional()
  numericTolerance?: number;

  @IsString()
  @IsOptional()
  sampleAnswer?: string;

  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];
}
