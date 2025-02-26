import { DynamicModule } from '@nestjs/common';
import { CastMembersModule } from '@/modules/cast-members-module/cast-members.module';
import { CategoriesModule } from '@/modules/categories-module/categories.module';
import { GenresModule } from '@/modules/genres-module/genres.module';
import { VIDEO_PROVIDERS } from '@/modules/videos-module/videos.providers';

export class VideosModule {
  static forRoot(): DynamicModule {
    return {
      module: VideosModule,
      imports: [CategoriesModule.forFeature(), GenresModule.forFeature(), CastMembersModule.forFeature()],
      providers: [...Object.values(VIDEO_PROVIDERS.REPOSITORIES), ...Object.values(VIDEO_PROVIDERS.USE_CASES)],
      exports: [VIDEO_PROVIDERS.REPOSITORIES.VIDEO_REPOSITORY.provide],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: VideosModule,
      imports: [CategoriesModule.forFeature(), GenresModule.forFeature(), CastMembersModule.forFeature()],
      providers: [...Object.values(VIDEO_PROVIDERS.REPOSITORIES), ...Object.values(VIDEO_PROVIDERS.USE_CASES)],
      exports: [VIDEO_PROVIDERS.REPOSITORIES.VIDEO_REPOSITORY.provide],
    };
  }
}
