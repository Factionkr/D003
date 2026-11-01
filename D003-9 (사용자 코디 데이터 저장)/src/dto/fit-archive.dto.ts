import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  Length,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ──────── Enums ────────
export enum ItemCategory {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  OUTER = 'OUTER',
  SHOES = 'SHOES',
  ACC = 'ACC',
}

export enum ItemSource {
  USER_CLOSET = 'USER_CLOSET',
  ECOMMERCE_PRODUCT = 'ECOMMERCE_PRODUCT',
}

export enum WeatherCondition {
  SUNNY = 'SUNNY',
  RAINY = 'RAINY',
  SNOWY = 'SNOWY',
  CLOUDY = 'CLOUDY',
  CLEAR = 'CLEAR',
}

export enum TpoCategory {
  BUSINESS = 'BUSINESS',
  CASUAL = 'CASUAL',
  DATE = 'DATE',
  FORMAL = 'FORMAL',
  WORKOUT = 'WORKOUT',
}

export enum PrivacyLevel {
  PRIVATE = 'PRIVATE',
  FRIENDS = 'FRIENDS',
  PUBLIC = 'PUBLIC',
}

// ──────── Bounding Box ────────
export class BoundingBoxDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  w!: number;

  @IsNumber()
  h!: number;
}

// ──────── Archive Item DTO ────────
export class CreateArchiveItemDto {
  @IsEnum(ItemCategory)
  category!: ItemCategory;

  @IsEnum(ItemSource)
  @IsNotEmpty()
  item_source!: ItemSource;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  product_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  item_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BoundingBoxDto)
  bounding_box?: BoundingBoxDto;
}

// ──────── Environment Context DTO ────────
export class CreateEnvironmentContextDto {
  @IsOptional()
  @IsNumber()
  temperature_min?: number;

  @IsOptional()
  @IsNumber()
  temperature_max?: number;

  @IsOptional()
  @IsEnum(WeatherCondition)
  weather_condition?: WeatherCondition;

  @IsOptional()
  @IsEnum(TpoCategory)
  tpo_category?: TpoCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location_city?: string;
}

// ──────── Create Fit Archive Request ────────
export class CreateFitArchiveDto {
  @IsDateString()
  fit_date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsNotEmpty()
  snapshot_base64_or_signed_url!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateArchiveItemDto)
  items!: CreateArchiveItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEnvironmentContextDto)
  context?: CreateEnvironmentContextDto;
}

// ──────── Update / Patch DTO ────────
export class UpdateFitArchiveDto {
  @IsOptional()
  @IsBoolean()
  is_worn_in_reality?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  privacy_level?: PrivacyLevel;

  @IsOptional()
  @IsNumber()
  satisfaction_score?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  fit_rating?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

