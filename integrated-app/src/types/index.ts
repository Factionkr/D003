// ==========================================
// D003 통합 AI 코디 시스템 전체 타입 정의 (Types)
// ==========================================

// 1. 체형 분석 (D003-1)
export type BodyType = '모래시계형' | '역삼각형' | '삼각형(A라인)' | '직사각형' | '라운드형' | '미상';

export interface BodyLandmarks {
  left_shoulder: [number, number];
  right_shoulder: [number, number];
  left_waist: [number, number];
  right_waist: [number, number];
  left_hip: [number, number];
  right_hip: [number, number];
  left_ankle?: [number, number];
  nose?: [number, number];
}

export interface BodyAnalysisResult {
  bodyType: BodyType;
  metrics: {
    shoulderWidth: number;
    hipWidth: number;
    waistWidth: number;
    torsoRatio: number;
    shoulderHipRatio: number;
    waistHipRatio: number;
  };
  stylingTips: string[];
  recommendedItems: string[];
  avoidItems: string[];
  analyzedAt: string;
}

// 2. 사용자 프로필 & 온보딩 (D003-2)
export type GenderType = 'male' | 'female' | 'other' | 'none';

export type OccupationType =
  | 'student'
  | 'office_worker'
  | 'it_design'
  | 'service_sales'
  | 'self_employed'
  | 'other';

export type StyleType =
  | 'casual'
  | 'minimal'
  | 'street'
  | 'business_casual'
  | 'amekaji'
  | 'sporty'
  | 'gorpcore'
  | 'feminine';

export interface UserProfile {
  id: string;
  nickname: string;
  gender: GenderType;
  birthDate: string;
  country: string;
  city: string;
  occupation: OccupationType;
  preferredStyles: StyleType[];
  personalColor?: '봄웜톤' | '여름쿨톤' | '가을웜톤' | '겨울쿨톤';
  preferredFit?: '오버핏' | '레귤러핏' | '슬림핏';
  bodyAnalysis?: BodyAnalysisResult;
}

// 3. 날씨 및 기온 (D003-3)
export interface WeatherData {
  city: string;
  temperature: number;      // 섭씨 (°C)
  feelsLike: number;        // 체감온도 (°C)
  humidity: number;         // 습도 (%)
  weatherCondition: 'Clear' | 'Clouds' | 'Rain' | 'Snow' | 'Wind';
  conditionKorean: string;
  windSpeed: number;        // m/s
  precipitationProb: number; // 강수확률 (%)
  minTemp: number;
  maxTemp: number;
  updatedAt: string;
}

export interface WeatherStylingGuide {
  minTemp: number;
  maxTemp: number;
  recommendedText: string;
  keyCategories: string[];
  stylingAdvice: string;
}

// 4. 옷장 아이템 (D003-4)
export type CategoryKey =
  | 'top'
  | 'pants'
  | 'skirt'
  | 'onepiece'
  | 'outer'
  | 'hat'
  | 'shoes'
  | 'bag'
  | 'jewelry'
  | 'etc';

export interface WardrobeItem {
  id: string;
  name: string;
  category: CategoryKey;
  subCategory?: string;
  colors: string[];
  seasons: string[];      // 봄, 여름, 가을, 겨울, 사계절
  styles: string[];       // 캐주얼, 미니멀, 비즈니스/출근룩, 스트릿 등
  imageUrl: string;
  memo?: string;
  isFavorite?: boolean;
  wearCount?: number;
  lastWornDate?: string;
  createdAt: string;
}

// 5. 일정 및 TPO (D003-5)
export type OccasionType =
  | 'WORK_OFFICE'          // 일반 출근
  | 'WORK_MEETING'         // 중요 비즈니스 미팅/발표
  | 'WEDDING_GUEST'        // 결혼식 하객
  | 'FUNERAL'              // 장례식/조문
  | 'SPECIAL_ANNIVERSARY'  // 데이트/기념일
  | 'WEEKEND_OUTING'       // 주말 나들이/약속
  | 'WEEKEND_DAILY'        // 가벼운 외출/동네
  | 'AFTER_WORK_DINNER'    // 회식/모임
  | 'SPORTS_FITNESS';      // 운동/레저

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  occasion: OccasionType;
  formalityLevel: number;  // 1.0 (매우 캐주얼) ~ 5.0 (엄숙/포멀)
  mobility: 'PUBLIC_TRANSIT' | 'PERSONAL_CAR' | 'WALKING';
  indoorOutdoorRatio: 'MAINLY_INDOOR' | 'BALANCED' | 'MAINLY_OUTDOOR';
  locationName: string;
  notes?: string;
}

// 6 & 7. AI 코디 추천 엔진 & 스코어링 (D003-7)
export interface ScoreBreakdown {
  tpoMatchScore: number;     // TPO 적합성 (30%)
  weatherMatchScore: number; // 날씨/기온 일치도 (25%)
  bodyTypeScore: number;     // 체형 보완도 (20%)
  stylePreferenceScore: number; // 취향/선호도 (15%)
  colorHarmonyScore: number; // 컬러 매칭 조화 (10%)
  totalScore: number;        // 100점 만점
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  topItem: WardrobeItem;
  bottomItem?: WardrobeItem;
  outerItem?: WardrobeItem;
  shoesItem?: WardrobeItem;
  accessoryItem?: WardrobeItem;
  score: ScoreBreakdown;
  stylistReasoning: {
    tpoReason: string;
    weatherReason: string;
    bodyFitReason: string;
    colorReason: string;
    overallReview: string;
  };
  dressCode: string;
  isFallbackApplied: boolean;
  fallbackItems?: WardrobeItem[];
  fallbackReason?: string;
}

// 6 & 8. 가상 피팅 룸 (D003-6, D003-8)
export type VTONModel = 'IDM-VTON' | 'CatVTON' | 'VITON-HD';

export interface VirtualFittingResult {
  jobId: string;
  vtonModel: VTONModel;
  userAvatarUrl: string;
  fittedResultUrl: string;
  fittedGarments: {
    itemId: string;
    name: string;
    category: string;
    layerOrder: number;
  }[];
  metrics: {
    inferenceTimeSec: number;
    resolution: string;
    idPreservationScore: number;
  };
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  completedAt: string;
}

// 9. 코디 아카이브 & OOTD 캘린더 (D003-9)
export interface DailyFitArchive {
  id: string;
  date: string;             // YYYY-MM-DD
  outfit: OutfitRecommendation;
  photoUrl?: string;
  rating: number;           // 1 ~ 5
  feedbackText?: string;
  wornWeather?: {
    temp: number;
    condition: string;
  };
  occasionName: string;
  createdAt: string;
}

export interface MonthlyStatsReport {
  totalLoggedDays: number;
  averageRating: number;
  topStyle: string;
  mostWornItems: { item: WardrobeItem; count: number }[];
  categoryBreakdown: { category: string; count: number; percentage: number }[];
}

