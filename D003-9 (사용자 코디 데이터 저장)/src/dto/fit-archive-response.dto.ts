// ──────── Response Interfaces ────────

export interface ArchiveItemResponse {
  id: string;
  category: string;
  item_source: string;
  product_id?: string;
  item_name: string;
  brand?: string;
  color?: string;
  size?: string;
  bounding_box?: { x: number; y: number; w: number; h: number };
}

export interface EnvironmentContextResponse {
  temperature_min?: number;
  temperature_max?: number;
  weather_condition?: string;
  tpo_category?: string;
  location_city?: string;
}

export interface FeedbackResponse {
  satisfaction_score?: number;
  fit_rating?: string;
  memo?: string;
  created_at: string;
}

export interface FitArchiveDetailResponse {
  archive_id: string;
  user_id: string;
  fit_date: string;
  title?: string;
  fitting_snapshot_url: string;
  thumbnail_url: string;
  is_worn_in_reality: boolean;
  privacy_level: string;
  created_at: string;
  updated_at: string;
  items: ArchiveItemResponse[];
  context?: EnvironmentContextResponse;
  feedback?: FeedbackResponse;
}

export interface CalendarDayEntry {
  fit_date: string;
  archive_id: string;
  thumbnail_url: string;
  tpo_category?: string;
  title?: string;
}

export interface CalendarMonthResponse {
  year: number;
  month: number;
  entries: CalendarDayEntry[];
}

export interface MonthlyStatsResponse {
  total_fits: number;
  worn_count: number;
  top_categories: { category: string; count: number }[];
  top_brands: { brand: string; count: number }[];
  temperature_ranges: { range: string; count: number }[];
  avg_satisfaction: number | null;
}

