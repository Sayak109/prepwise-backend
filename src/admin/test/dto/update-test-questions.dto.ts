import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TestQuestionInputDto } from './test-question-input.dto';

export class UpdateTestQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestQuestionInputDto)
  questions: TestQuestionInputDto[];
}
