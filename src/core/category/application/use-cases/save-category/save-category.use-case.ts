import { SaveCategoryInput } from '@/core/category/application/use-cases/save-category/save-category.input';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { ICategoryRepository } from '@/core/category/domain/category.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { EntityValidationError } from '@/core/shared/domain/validators/validation.error';

export class SaveCategoryUseCase implements IUseCase<SaveCategoryInput, SaveCategoryOutput> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(input: SaveCategoryInput): Promise<SaveCategoryOutput> {
    const category = await this.categoryRepository.findById(new CategoryId(input.id));
    return category ? this.updateCategory(input, category) : this.createCategory(input);
  }

  private async createCategory(input: SaveCategoryInput): Promise<SaveCategoryOutput> {
    const category = Category.create({ ...input, id: new CategoryId(input.id) });
    if (category.notification.hasErrors()) {
      throw new EntityValidationError(category.notification.toJSON());
    }
    await this.categoryRepository.insert(category);
    return { id: category.id.value, created: true };
  }

  private async updateCategory(input: SaveCategoryInput, category: Category): Promise<SaveCategoryOutput> {
    'name' in input && category.changeName(input.name);
    'description' in input && category.changeDescription(input.description);
    'is_active' in input && category[input.is_active ? 'activate' : 'deactivate']();
    'created_at' in input && category.changeCreatedAt(input.created_at);
    if (category.notification.hasErrors()) {
      throw new EntityValidationError(category.notification.toJSON());
    }
    await this.categoryRepository.update(category);
    return { id: category.id.value, created: false };
  }
}

export type SaveCategoryOutput = { id: string; created: boolean };
