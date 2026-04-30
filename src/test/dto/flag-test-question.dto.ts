import { IsBoolean } from 'class-validator';

export class FlagTestQuestionDto {
  @IsBoolean()
  flagged: boolean;
}
