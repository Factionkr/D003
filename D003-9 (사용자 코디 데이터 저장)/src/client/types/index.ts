// ──────── Client-side Type Definitions ────────

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArchiveItem {
  id: string;
  category: 'TOP' | 'BOTTOM' | 'OUTER' | 'SHOES' | 'ACC';
  item_source: 'USER_CLOSET' | 'ECOMMERCE_PRODUCT';
  product_id?: string;
  item_name: string;
  brand?: string;
  color?: string;
  size?: string;
  bounding_box?: BoundingBox;
}

export interface EnvironmentContext {
  temperature_min?: number;
  temperature_max?: number;
  weather_condition?: 'SUNNY' | 'RAINY' | 'SNOWY' | 'CLOUDY' | 'CLEAR';
  tpo_category?: 'BUSINESS' | 'CASUAL' | 'DATE' | 'FORMAL' | 'WORKOUT';
  location_city?: string;
}

export interface UserFeedback {
  satisfaction_score?: number;
  fit_rating?: string;
  memo?: string;
  created_at: string;
}

export interface FitArchiveDetail {
  archive_id: string;
  user_id: string;
  fit_date: string;
  title?: string;
  fitting_snapshot_url: string;
  thumbnail_url: string;
  is_worn_in_reality: boolean;
  privacy_level: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
  created_at: string;
  updated_at: string;
  items: ArchiveItem[];
  context?: EnvironmentContext;
  feedback?: UserFeedback;
}

export interface CalendarDayEntry {
  fit_date: string;
  archive_id: string;
  thumbnail_url: string;
  tpo_category?: string;
  title?: string;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  entries: CalendarDayEntry[];
}

export interface MonthlyStats {
  total_fits: number;
  worn_count: number;
  top_categories: { category: string; count: number }[];
  top_brands: { brand: string; count: number }[];
  temperature_ranges: { range: string; count: number }[];
  avg_satisfaction: number | null;
}

// TPO 태그 색상 매핑
export const TPO_COLORS: Record<string, string> = {
  BUSINESS: '#2563EB',
  CASUAL: '#16A34A',
  DATE: '#EC4899',
  FORMAL: '#6D28D9',
  WORKOUT: '#EA580C',
};

export const TPO_LABELS: Record<string, string> = {
  BUSINESS: '비즈니스',
  CASUAL: '캐주얼',
  DATE: '데이트',
  FORMAL: '포멀',
  WORKOUT: '운동',
};

export const WEATHER_ICONS: Record<string, string> = {
  SUNNY: '☀️',
  CLEAR: '🌤️',
  CLOUDY: '☁️',
  RAINY: '🌧️',
  SNOWY: '❄️',
};

export const CATEGORY_LABELS: Record<string, string> = {
  TOP: '상의',
  BOTTOM: '하의',
  OUTER: '아우터',
  SHOES: '신발',
  ACC: '액세서리',
};

