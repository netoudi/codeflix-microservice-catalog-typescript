import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { CastMembersModule } from '@/modules/cast-members-module/cast-members.module';
import { CategoriesModule } from '@/modules/categories-module/categories.module';
import { GenresModule } from '@/modules/genres-module/genres.module';
import { VideosModule } from '@/modules/videos-module/videos.module';

@Module({
  imports: [CategoriesModule.forRoot(), GenresModule.forRoot(), CastMembersModule.forRoot(), VideosModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
