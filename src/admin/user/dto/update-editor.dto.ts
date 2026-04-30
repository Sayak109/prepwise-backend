import { PartialType } from '@nestjs/mapped-types';
import { CreateEditorDto } from './create-editor.dto';

export class UpdateEditorDto extends PartialType(CreateEditorDto) {}
