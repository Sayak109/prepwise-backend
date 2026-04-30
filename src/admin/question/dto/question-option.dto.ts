import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QuestionOptionDto {
  @IsString()
  optionText: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;
}
