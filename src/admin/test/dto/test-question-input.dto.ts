import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class TestQuestionInputDto {
  @IsUUID()
  questionId: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsNumber()
  @IsOptional()
  points?: number;
}
