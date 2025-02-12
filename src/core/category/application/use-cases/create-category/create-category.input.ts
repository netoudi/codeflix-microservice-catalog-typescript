import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString, validateSync, ValidationError } from 'class-validator';
import { CategoryId } from '@/core/category/domain/category.entity';

export type CreateCategoryInputConstructor = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
};

export class CreateCategoryInput {
  @IsString()
  @IsNotEmpty()
  id: CategoryId;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string | null;

  @IsBoolean()
  @IsOptional()
  is_active: boolean;

  @IsDate()
  @IsOptional()
  created_at: Date;

  constructor(props: CreateCategoryInputConstructor) {
    if (!props) return;
    this.id = new CategoryId(props.id);
    this.name = props.name;
    this.description = props.description;
    this.is_active = props.is_active;
    this.created_at = props.created_at;
  }
}

export class ValidateCreateCategoryInput {
  static validate(input: CreateCategoryInput): ValidationError[] {
    return validateSync(input);
  }
}
