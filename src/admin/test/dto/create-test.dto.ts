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
import { Difficulty } from '@prisma/client';
import { TestQuestionInputDto } from './test-question-input.dto';

export class CreateTestDto {
  @IsString()
  title: string;

  @IsUUID()
  @IsOptional()
  topicId?: string;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsBoolean()
  @IsOptional()
  isTimed?: boolean;

  @IsNumber()
  @IsOptional()
  durationSeconds?: number;

  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestQuestionInputDto)
  @IsOptional()
  questions?: TestQuestionInputDto[];
}
