import { CastMemberType, InvalidCastMemberTypeError } from '@/core/cast-member/domain/cast-member-type.vo';
import { CastMemberId } from '@/core/cast-member/domain/cast-member.aggregate';
import { NestedCastMember } from '@/core/cast-member/domain/nested-cast-member.entity';
import { CategoryId } from '@/core/category/domain/category.entity';
import { NestedCategory } from '@/core/category/domain/nested-category.entity';
import { GenreId } from '@/core/genre/domain/genre.aggregate';
import { NestedGenre } from '@/core/genre/domain/nested-genre.entity';
import { Either } from '@/core/shared/domain/either';
import { Notification } from '@/core/shared/domain/validators/notification';
import { LoadEntityError } from '@/core/shared/domain/validators/validation.error';
import { Rating } from '@/core/video/domain/rating.vo';
import { Video, VideoId } from '@/core/video/domain/video.aggregate';

export const VIDEO_DOCUMENT_TYPE_NAME = 'Video';

export type VideoDocument = {
  video_title: string;
  video_title_keyword: string;
  video_description: string;
  year_launched: number;
  duration: number;
  rating: string;
  is_opened: boolean;
  is_published: boolean;
  banner_url: string | null;
  thumbnail_url: string | null;
  thumbnail_half_url: string | null;
  trailer_url: string;
  video_url: string;
  categories: {
    category_id: string;
    category_name: string;
    is_active: boolean;
    deleted_at: Date | string | null;
    is_deleted: boolean;
  }[];
  genres: {
    genre_id: string;
    genre_name: string;
    is_active: boolean;
    deleted_at: Date | string | null;
    is_deleted: boolean;
  }[];
  cast_members: {
    cast_member_id: string;
    cast_member_name: string;
    cast_member_type: number;
    deleted_at: Date | string | null;
    is_deleted: boolean;
  }[];
  created_at: Date | string;
  deleted_at: Date | string | null;
  type: typeof VIDEO_DOCUMENT_TYPE_NAME;
};

export class VideoElasticSearchMapper {
  static toEntity(id: string, document: VideoDocument): Video {
    if (document.type !== VIDEO_DOCUMENT_TYPE_NAME) {
      throw new Error('Invalid document type');
    }

    const notification = new Notification();

    const [rating, errorRating] = Rating.create(document.rating as any).asArray();

    if (errorRating) {
      notification.addError(errorRating.message, 'rating');
    }

    const nestedCategories = document.categories.map(
      (category) =>
        new NestedCategory({
          category_id: new CategoryId(category.category_id),
          name: category.category_name,
          is_active: category.is_active,
          deleted_at:
            category.deleted_at === null
              ? null
              : !(category.deleted_at instanceof Date)
                ? new Date(category.deleted_at)
                : category.deleted_at,
        }),
    );

    if (!nestedCategories.length) {
      notification.addError('categories should not be empty', 'categories');
    }

    const nestedGenres = document.genres.map(
      (genre) =>
        new NestedGenre({
          genre_id: new GenreId(genre.genre_id),
          name: genre.genre_name,
          is_active: genre.is_active,
          deleted_at:
            genre.deleted_at === null
              ? null
              : !(genre.deleted_at instanceof Date)
                ? new Date(genre.deleted_at)
                : genre.deleted_at,
        }),
    );

    if (!nestedGenres.length) {
      notification.addError('genres should not be empty', 'genres');
    }

    const [nestedCastMembers, errorsCastMembers] = Either.ok(document.cast_members)
      .map((cast_members) => cast_members || [])
      .chainEach<NestedCastMember[], InvalidCastMemberTypeError[]>(
        (cast_member): Either<NestedCastMember, InvalidCastMemberTypeError> => {
          const [type, errorType] = CastMemberType.create(cast_member.cast_member_type).asArray();

          if (errorType) {
            return Either.fail(errorType);
          }

          return Either.ok(
            new NestedCastMember({
              cast_member_id: new CastMemberId(cast_member.cast_member_id),
              name: cast_member.cast_member_name,
              type,
              deleted_at:
                cast_member.deleted_at === null
                  ? null
                  : !(cast_member.deleted_at instanceof Date)
                    ? new Date(cast_member.deleted_at)
                    : cast_member.deleted_at,
            }),
          );
        },
      )
      .asArray();

    if (!nestedCastMembers.length) {
      notification.addError('genres should not be empty', 'genres');
    }

    if (errorsCastMembers && errorsCastMembers.length) {
      errorsCastMembers.forEach((error) => {
        notification.addError(error.message, 'cast_members');
      });
    }

    const video = new Video({
      video_id: new VideoId(id),
      title: document.video_title,
      description: document.video_description,
      year_launched: document.year_launched,
      duration: document.duration,
      rating,
      is_opened: document.is_opened,
      is_published: document.is_published,
      banner_url: document.banner_url,
      thumbnail_url: document.thumbnail_url,
      thumbnail_half_url: document.thumbnail_half_url,
      trailer_url: document.trailer_url,
      video_url: document.video_url,

      categories: new Map(nestedCategories.map((category) => [category.category_id.id, category])),
      genres: new Map(nestedGenres.map((genre) => [genre.genre_id.id, genre])),
      cast_members: new Map(nestedCastMembers.map((cast_member) => [cast_member.cast_member_id.id, cast_member])),
      created_at: !(document.created_at instanceof Date) ? new Date(document.created_at) : document.created_at,
      deleted_at:
        document.deleted_at === null
          ? null
          : !(document.deleted_at instanceof Date)
            ? new Date(document.deleted_at!)
            : document.deleted_at,
    });

    video.validate();

    notification.copyErrors(video.notification);

    if (notification.hasErrors()) {
      throw new LoadEntityError(notification.toJSON());
    }

    return video;
  }

  static toDocument(entity: Video): VideoDocument {
    return {
      video_title: entity.title,
      video_title_keyword: entity.title,
      video_description: entity.description,
      year_launched: entity.year_launched,
      duration: entity.duration,
      rating: entity.rating.value,
      is_opened: entity.is_opened,
      is_published: entity.is_published,
      banner_url: entity.banner_url,
      thumbnail_url: entity.thumbnail_url,
      thumbnail_half_url: entity.thumbnail_half_url,
      trailer_url: entity.trailer_url,
      video_url: entity.video_url,
      categories: Array.from(entity.categories.values()).map((category) => ({
        category_id: category.category_id.id,
        category_name: category.name,
        is_active: category.is_active,
        deleted_at: category.deleted_at,
        is_deleted: category.deleted_at !== null,
      })),
      genres: Array.from(entity.genres.values()).map((genre) => ({
        genre_id: genre.genre_id.id,
        genre_name: genre.name,
        is_active: genre.is_active,
        deleted_at: genre.deleted_at,
        is_deleted: genre.deleted_at !== null,
      })),
      cast_members: Array.from(entity.cast_members.values()).map((cast_member) => ({
        cast_member_id: cast_member.cast_member_id.id,
        cast_member_name: cast_member.name,
        cast_member_type: cast_member.type.type,
        deleted_at: cast_member.deleted_at,
        is_deleted: cast_member.deleted_at !== null,
      })),
      created_at: entity.created_at,
      deleted_at: entity.deleted_at,
      type: VIDEO_DOCUMENT_TYPE_NAME,
    };
  }
}
