import { GenreFakeBuilder } from '@/core/genre/domain/genre-fake.builder';
import GenreValidatorFactory from '@/core/genre/domain/genre.validator';
import { AggregateRoot } from '@/core/shared/domain/aggregate-root';
import { Uuid } from '@/core/shared/domain/value-objects/uuid.vo';

export type GenreConstructorProps = {
  genre_id: GenreId;
  name: string;
  is_active: boolean;
  created_at: Date;
  deleted_at?: Date | null;
};

export type GenreCreateCommand = {
  genre_id: GenreId;
  name: string;
  is_active: boolean;
  created_at: Date;
};

export class GenreId extends Uuid {}

export class Genre extends AggregateRoot {
  genre_id: GenreId;
  name: string;
  is_active: boolean;
  created_at: Date;
  deleted_at: Date | null = null;

  constructor(props: GenreConstructorProps) {
    super();
    this.genre_id = props.genre_id;
    this.name = props.name;
    this.is_active = props.is_active;
    this.created_at = props.created_at;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: GenreCreateCommand) {
    const genre = new Genre(props);
    genre.validate(['name']);
    return genre;
  }

  changeName(name: string): void {
    this.name = name;
    this.validate(['name']);
  }

  changeCreatedAt(created_at: Date): void {
    this.created_at = created_at;
  }

  validate(fields?: string[]) {
    const validator = GenreValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  activate() {
    this.is_active = true;
  }

  deactivate() {
    this.is_active = false;
  }

  markAsDeleted() {
    this.deleted_at = new Date();
  }

  markAsUndeleted() {
    this.deleted_at = null;
  }

  static fake() {
    return GenreFakeBuilder;
  }

  get entityId() {
    return this.genre_id;
  }

  toJSON() {
    return {
      genre_id: this.genre_id.id,
      name: this.name,

      is_active: this.is_active,
      created_at: this.created_at,
      deleted_at: this.deleted_at,
    };
  }
}
