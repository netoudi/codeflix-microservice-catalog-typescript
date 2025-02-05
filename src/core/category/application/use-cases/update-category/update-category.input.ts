import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidationError, validateSync } from 'class-validator';

export type UpdateCategoryInputConstructor = {
  id: string;
  name?: string;
  description?: string | null;
  is_active?: boolean;
};

export class UpdateCategoryInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  constructor(props: UpdateCategoryInputConstructor) {
    if (!props) return;
    this.id = props.id;
    props.name && (this.name = props.name);
    props.description && (this.description = props.description);
    props.is_active !== undefined && props.is_active !== null && (this.is_active = props.is_active);
  }
}

export class ValidateUpdateCategoryInput {
  static validate(input: UpdateCategoryInput): ValidationError[] {
    return validateSync(input);
  }
}
