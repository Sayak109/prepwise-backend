import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SubmitTestAnswerItemDto {
  @IsUUID()
  questionId!: string;

  @IsUUID()
  @IsOptional()
  selectedOptionId?: string;

  @IsString()
  @IsOptional()
  answerText?: string;
}

export class SubmitTestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitTestAnswerItemDto)
  answers!: SubmitTestAnswerItemDto[];
}

