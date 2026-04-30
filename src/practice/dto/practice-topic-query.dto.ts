import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class PracticeTopicQueryDto {
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
  parentId?: string;

  @IsBooleanString()
  @IsOptional()
  isPremium?: string;

  @IsBooleanString()
  @IsOptional()
  includeQuestions?: string;
}
