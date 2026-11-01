import { z } from 'zod';

// ==========================================
// 1. Enum & Const Options
// ==========================================

export const GENDER_OPTIONS = [
  { value: 'male', label: '남성', description: '체형 랜드마크 DB 매핑' },
  { value: 'female', label: '여성', description: '체형 랜드마크 DB 매핑' },
  { value: 'other', label: '기타', description: '중립형 핏 및 실루엣 매핑' },
  { value: 'none', label: '선택 안 함', description: '기본 범용 알고리즘 적용' },
] as const;

export type GenderType = (typeof GENDER_OPTIONS)[number]['value'];

export interface CountryInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  standardSize: string;
}

export const COUNTRY_OPTIONS: CountryInfo[] = [
  { code: 'KR', name: 'South Korea', nativeName: '대한민국', flag: '🇰🇷', standardSize: 'KS 규격 (90-105 / 55-77)' },
  { code: 'US', name: 'United States', nativeName: '미국', flag: '🇺🇸', standardSize: 'US 규격 (XS-XL / 0-14)' },
  { code: 'JP', name: 'Japan', nativeName: '일본', flag: '🇯🇵', standardSize: 'JIS 규격 (S-LL / 7-13)' },
  { code: 'GB', name: 'United Kingdom', nativeName: '영국', flag: '🇬🇧', standardSize: 'UK 규격 (6-16)' },
  { code: 'FR', name: 'France', nativeName: '프랑스', flag: '🇫🇷', standardSize: 'EU 규격 (34-44)' },
  { code: 'DE', name: 'Germany', nativeName: '독일', flag: '🇩🇪', standardSize: 'EU 규격 (32-42)' },
  { code: 'IT', name: 'Italy', nativeName: '이탈리아', flag: '🇮🇹', standardSize: 'IT 규격 (38-48)' },
  { code: 'CA', name: 'Canada', nativeName: '캐나다', flag: '🇨🇦', standardSize: 'US/CA 규격' },
  { code: 'AU', name: 'Australia', nativeName: '호주', flag: '🇦🇺', standardSize: 'AU 규격 (6-16)' },
  { code: 'SG', name: 'Singapore', nativeName: '싱가포르', flag: '🇸🇬', standardSize: 'ASIAN Standard' },
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  KR: [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시',
    '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
    '수원시', '고양시', '용인시', '성남시', '부천시', '화성시',
    '안산시', '남양주시', '안양시', '평택시', '제주시', '서귀포시'
  ],
  US: [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Seattle', 'San Francisco', 'Boston', 'Austin', 'Miami'
  ],
  JP: [
    'Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo',
    'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki', 'Saitama'
  ],
  GB: [
    'London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow',
    'Liverpool', 'Bristol', 'Oxford', 'Cambridge'
  ],
  FR: [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux'
  ],
  DE: [
    'Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Dusseldorf'
  ],
  IT: [
    'Milan', 'Rome', 'Florence', 'Naples', 'Turin', 'Venice', 'Bologna'
  ],
  CA: [
    'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'
  ],
  AU: [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast'
  ],
  SG: [
    'Singapore Central', 'Jurong', 'Tampines', 'Woodlands', 'Ang Mo Kio'
  ]
};

export const OCCUPATION_OPTIONS = [
  { value: 'student', label: '학생', desc: '캠퍼스룩, 데일리 캐주얼 및 활동성 중심', icon: 'GraduationCap' },
  { value: 'office_worker', label: '사무직 / 전문직', desc: '출근룩, 비즈니스 캐주얼 및 스마트 핏', icon: 'Briefcase' },
  { value: 'it_design', label: 'IT / 기획 / 디자인', desc: '트렌디, 스마트 캐주얼 및 편안한 워크웨어', icon: 'Laptop' },
  { value: 'service_sales', label: '서비스 / 영업직', desc: '신뢰감을 주는 단정한 핏 & TPO 포멀 스타일', icon: 'Users' },
  { value: 'self_employed', label: '자영업', desc: '자유도 높은 실용적 핏 & 개성 있는 연출', icon: 'Store' },
  { value: 'other', label: '기타', desc: '라이프스타일 맞춤 유연한 추천', icon: 'Sparkles' },
] as const;

export type OccupationType = (typeof OCCUPATION_OPTIONS)[number]['value'];

export const STYLE_OPTIONS = [
  { value: 'casual', label: '캐주얼', tag: '#편안함 #데일리', example: '스웨트셔츠, 데님, 스니커즈' },
  { value: 'minimal', label: '미니멀', tag: '#심플 #모던', example: '단색 슬랙스, 무지 티셔츠, 셔츠' },
  { value: 'street', label: '스트릿', tag: '#힙스터 #오버핏', example: '오버사이즈 후디, 카고팬츠, 볼캡' },
  { value: 'business_casual', label: '비즈니스 캐주얼', tag: '#스마트 #출근룩', example: '블레이저, 치노팬츠, 로퍼' },
  { value: 'amekaji', label: '아메카지', tag: '#워크웨어 #빈티지', example: '퍼티그 팬츠, 워크자켓, 부츠' },
  { value: 'sporty', label: '스포티', tag: '#액티브 #애슬레저', example: '조거팬츠, 윈드브레이커, 러닝화' },
  { value: 'gorpcore', label: '고프코어', tag: '#아웃도어 #기능성', example: '하드쉘 자켓, 테크웨어 카고, 트레킹' },
  { value: 'feminine', label: '페미닌', tag: '#우아함 #소프트', example: '원피스, 블라우스, 플리츠 스커트' },
] as const;

export type StyleType = (typeof STYLE_OPTIONS)[number]['value'];

// ==========================================
// 2. TypeScript Interfaces
// ==========================================

export interface UserProfile {
  nickname: string;
  gender: GenderType | '';
  birth_date: string;
  country: string;
  city: string;
  occupation: OccupationType | '';
  preferred_styles: StyleType[];
}

export interface OnboardingPayload {
  user_id: string;
  profile: {
    nickname: string;
    gender: GenderType;
    birth_date: string;
    country: string;
    city: string;
    occupation: OccupationType;
    preferred_styles: StyleType[];
  };
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ==========================================
// 3. Zod Validation Schemas
// ==========================================

// Regex: 한글/영문/숫자/공백 2~20자
export const NICKNAME_REGEX = /^[a-zA-Z가-힣0-9\s]{2,20}$/;

export const step1Schema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, { message: '닉네임은 2자 이상이어야 합니다.' })
    .max(20, { message: '닉네임은 20자 이하이어야 합니다.' })
    .regex(NICKNAME_REGEX, { message: '한글, 영문, 숫자 및 공백만 2~20자 입력 가능합니다.' }),
  gender: z.enum(['male', 'female', 'other', 'none'], {
    errorMap: () => ({ message: '성별을 선택해주세요.' }),
  }),
  birth_date: z
    .string()
    .min(1, { message: '생년월일을 선택해주세요.' })
    .refine((val) => {
      if (!val) return false;
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      const minAgeDate = new Date();
      minAgeDate.setFullYear(now.getFullYear() - 120);
      return d <= now && d >= minAgeDate;
    }, { message: '유효한 생년월일을 입력해주세요 (만 0세 ~ 120세).' }),
});

export const step2Schema = z.object({
  country: z.string().min(2, { message: '거주 국가를 선택해주세요.' }),
  city: z.string().min(1, { message: '거주 시/도시를 선택해주세요.' }),
});

export const step3Schema = z.object({
  occupation: z.enum(['student', 'office_worker', 'it_design', 'service_sales', 'self_employed', 'other'], {
    errorMap: () => ({ message: '직업군을 선택해주세요.' }),
  }),
});

export const step4Schema = z.object({
  preferred_styles: z
    .array(z.string())
    .min(1, { message: '최소 1개 이상의 스타일을 선택해주세요.' })
    .max(3, { message: '스타일은 최대 3개까지만 선택 가능합니다.' }),
});

export const fullProfileSchema = z.object({
  user_id: z.string().min(1),
  profile: z.object({
    nickname: step1Schema.shape.nickname,
    gender: step1Schema.shape.gender,
    birth_date: step1Schema.shape.birth_date,
    country: step2Schema.shape.country,
    city: step2Schema.shape.city,
    occupation: step3Schema.shape.occupation,
    preferred_styles: step4Schema.shape.preferred_styles,
  }),
  created_at: z.string(),
});
