import { DynamicModule } from '@nestjs/common';
import { CategoriesModule } from '@/modules/categories-module/categories.module';
import { GENRE_PROVIDERS } from '@/modules/genres-module/genres.providers';

export class GenresModule {
  static forRoot(): DynamicModule {
    return {
      module: GenresModule,
      imports: [CategoriesModule.forFeature()],
      providers: [...Object.values(GENRE_PROVIDERS.REPOSITORIES), ...Object.values(GENRE_PROVIDERS.USE_CASES)],
      exports: [GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: GenresModule,
      imports: [CategoriesModule.forFeature()],
      providers: [...Object.values(GENRE_PROVIDERS.REPOSITORIES), ...Object.values(GENRE_PROVIDERS.USE_CASES)],
      exports: [GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide],
    };
  }
}
