import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class EditorTopicPermissionDto {
  @IsString()
  topicId: string;

  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @IsBoolean()
  @IsOptional()
  canUpdate?: boolean;

  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;
}
