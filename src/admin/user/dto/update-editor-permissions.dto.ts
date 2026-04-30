import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EditorTopicPermissionDto } from './editor-topic-permission.dto';

export class UpdateEditorPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditorTopicPermissionDto)
  permissions: EditorTopicPermissionDto[];
}
