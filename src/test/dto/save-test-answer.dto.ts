import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SaveTestAnswerDto {
  @IsUUID()
  @IsOptional()
  selectedOptionId?: string;

  @IsString()
  @IsOptional()
  answerText?: string;
}
