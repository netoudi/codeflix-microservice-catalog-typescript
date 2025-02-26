import { DynamicModule } from '@nestjs/common';
import { CAST_MEMBER_PROVIDERS } from '@/modules/cast-members-module/cast-members.providers';

export class CastMembersModule {
  static forRoot(): DynamicModule {
    return {
      module: CastMembersModule,
      providers: [
        ...Object.values(CAST_MEMBER_PROVIDERS.REPOSITORIES),
        ...Object.values(CAST_MEMBER_PROVIDERS.USE_CASES),
      ],
      exports: [CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: CastMembersModule,
      providers: [
        ...Object.values(CAST_MEMBER_PROVIDERS.REPOSITORIES),
        ...Object.values(CAST_MEMBER_PROVIDERS.USE_CASES),
      ],
      exports: [CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide],
    };
  }
}
