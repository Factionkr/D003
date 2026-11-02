import { OccasionType, ScheduleEvent } from '../types';

export interface StyleCatalogRule {
  formalityScore: number;
  dressCode: string;
  recommendedKeywords: string[];
  avoidKeywords: string[];
  recommendedCategories: string[];
  summaryRule: string;
}

export class ScheduleService {
  /**
   * TPO별 포멀리티 중요도 점수 (D003-5 FORMALITY_PRIORITY)
   */
  public static readonly FORMALITY_PRIORITY: Record<OccasionType, number> = {
    FUNERAL: 5.0,
    WORK_MEETING: 4.5,
    WEDDING_GUEST: 4.0,
    WORK_OFFICE: 3.2,
    SPECIAL_ANNIVERSARY: 3.0,
    AFTER_WORK_DINNER: 2.5,
    WEEKEND_OUTING: 1.8,
    WEEKEND_DAILY: 1.0,
    SPORTS_FITNESS: 1.0,
  };

  /**
   * 포멀리티 수준별 표준 스타일링 규칙 카탈로그 (D003-5 STYLE_BASE_CATALOG)
   */
  public static readonly STYLE_CATALOG: Record<number, StyleCatalogRule> = {
    5.0: {
      formalityScore: 5.0,
      dressCode: 'Dark Formal (엄숙한 정장 / 블랙 타이)',
      recommendedKeywords: ['블랙', '포멀', '정장 슬랙스', '드레스 셔츠', '다크 더비슈즈', '단정한 자켓'],
      avoidKeywords: ['화려한 원색', '형광', '찢어진 데님', '맨발/샌들', '모자', '그래픽'],
      recommendedCategories: ['outer', 'top', 'pants', 'shoes'],
      summaryRule: '격식을 갖춘 모노톤 블랙/다크 네이비 수트 셋업과 정제된 더비슈즈를 권장합니다.'
    },
    4.0: {
      formalityScore: 4.0,
      dressCode: 'Business Formal (비즈니스 수트/포멀 오피스)',
      recommendedKeywords: ['테일러드', '블레이저', '울 슬랙스', '옥스포드 셔츠', '로퍼', '구두'],
      avoidKeywords: ['슬리퍼', '디스트로이드 진', '오버사이즈 후디', '트레이닝'],
      recommendedCategories: ['outer', 'top', 'pants', 'shoes'],
      summaryRule: '단정한 핏의 테일러드 블레이저와 울 슬랙스, 셔츠 조합으로 신뢰감을 주는 스타일링입니다.'
    },
    3.0: {
      formalityScore: 3.0,
      dressCode: 'Smart Casual (스마트 캐주얼 / 데이트룩)',
      recommendedKeywords: ['치노 팬츠', '세미와이드 슬랙스', '버튼다운 셔츠', '가디건', '니트', '레더 스니커즈'],
      avoidKeywords: ['운동용 트레이닝복', '과도한 로고 의류', '등산복'],
      recommendedCategories: ['top', 'pants', 'outer', 'shoes'],
      summaryRule: '깔끔한 니트나 셔츠에 단정한 슬랙스/치노, 미니멀 스니커즈로 세련되고 편안한 밸런스를 연출합니다.'
    },
    2.0: {
      formalityScore: 2.0,
      dressCode: 'City Casual / Day-to-Night (도심형 캐주얼)',
      recommendedKeywords: ['다크 데님', '와이드 팬츠', '크루넥 티셔츠', '블루종', '캐주얼 자켓', '로퍼'],
      avoidKeywords: ['형광 아웃도어', '슬리퍼'],
      recommendedCategories: ['top', 'pants', 'outer', 'shoes'],
      summaryRule: '트렌디한 데님이나 와이드 팬츠에 자켓이나 점퍼를 가볍게 걸쳐 활동성과 스타일을 동시에 만족시킵니다.'
    },
    1.0: {
      formalityScore: 1.0,
      dressCode: 'Relaxed Daily Casual (릴랙스 이지 캐주얼)',
      recommendedKeywords: ['이지 팬츠', '워싱 데님', '맨투맨', '후드티', '바람막이', '워킹 스니커즈'],
      avoidKeywords: ['딱딱한 정장 구두', '뻣뻣한 넥타이'],
      recommendedCategories: ['top', 'pants', 'shoes'],
      summaryRule: '착용감이 뛰어난 코튼 맨투맨, 편안한 밴딩 팬츠와 쿠셔닝 스니커즈로 편안함에 집중합니다.'
    }
  };

  /**
   * 해당 일정에 가장 부합하는 스타일 규칙 반환
   */
  public static getRuleForOccasion(occasion: OccasionType, customFormality?: number): StyleCatalogRule {
    const targetScore = customFormality ?? (this.FORMALITY_PRIORITY[occasion] || 3.0);
    const brackets = [5.0, 4.0, 3.0, 2.0, 1.0];
    const closest = brackets.reduce((prev, curr) =>
      Math.abs(curr - targetScore) < Math.abs(prev - targetScore) ? curr : prev
    );
    return this.STYLE_CATALOG[closest];
  }

  /**
   * 기본 추천 일정 목록
   */
  public static getDefaultEvents(): ScheduleEvent[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'event-1',
        title: '중요 클라이언트 비즈니스 미팅',
        date: today,
        occasion: 'WORK_MEETING',
        formalityLevel: 4.2,
        mobility: 'PUBLIC_TRANSIT',
        indoorOutdoorRatio: 'MAINLY_INDOOR',
        locationName: '강남구 역삼 테헤란로 본사',
        notes: '신뢰감을 주는 단정한 수트 또는 테일러드 블레이저 선호'
      },
      {
        id: 'event-2',
        title: '친구들과 주말 성수동 카페 나들이',
        date: today,
        occasion: 'WEEKEND_OUTING',
        formalityLevel: 1.8,
        mobility: 'WALKING',
        indoorOutdoorRatio: 'BALANCED',
        locationName: '성동구 성수동 카페거리',
        notes: '트렌디하고 편안한 미니멀/스트릿 캐주얼'
      },
      {
        id: 'event-3',
        title: '친한 동료 지인 결혼식 하객',
        date: today,
        occasion: 'WEDDING_GUEST',
        formalityLevel: 3.8,
        mobility: 'PERSONAL_CAR',
        indoorOutdoorRatio: 'MAINLY_INDOOR',
        locationName: '서초구 호텔 웨딩홀',
        notes: '화이트 상의 피하기, 단정한 셋업이나 롱코트'
      }
    ];
  }
}

