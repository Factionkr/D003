import {
  WardrobeItem,
  WeatherData,
  ScheduleEvent,
  UserProfile,
  OutfitRecommendation,
  ScoreBreakdown,
} from '../types';
import { ScheduleService } from './scheduleService';

export class RecommendationEngine {
  /**
   * D003-7 기반 코디 추천 메인 파이프라인
   */
  public static recommendOutfits(
    wardrobe: WardrobeItem[],
    weather: WeatherData,
    event: ScheduleEvent,
    profile: UserProfile,
    topK: number = 3
  ): OutfitRecommendation[] {
    const tpoRule = ScheduleService.getRuleForOccasion(event.occasion, event.formalityLevel);

    // 1. 하드 필터링 (Hard Constraints Filter)
    const validItems = this.applyHardFilter(wardrobe, weather, event, tpoRule);

    const tops = validItems.filter((i) => i.category === 'top');
    const bottoms = validItems.filter((i) => i.category === 'pants' || i.category === 'skirt');
    const outers = validItems.filter((i) => i.category === 'outer');
    const shoes = validItems.filter((i) => i.category === 'shoes');
    const bags = validItems.filter((i) => i.category === 'bag');

    const candidateCombinations: Array<{
      top: WardrobeItem;
      bottom?: WardrobeItem;
      outer?: WardrobeItem;
      shoes?: WardrobeItem;
      bag?: WardrobeItem;
    }> = [];

    // 의류가 부족할 경우를 대비한 가드
    const activeTops = tops.length > 0 ? tops : wardrobe.filter((i) => i.category === 'top');
    const activeBottoms = bottoms.length > 0 ? bottoms : wardrobe.filter((i) => i.category === 'pants' || i.category === 'skirt');
    const activeShoes = shoes.length > 0 ? shoes : wardrobe.filter((i) => i.category === 'shoes');

    // 조합 생성 (상위 조합 탐색)
    for (const t of activeTops.slice(0, 4)) {
      for (const b of activeBottoms.slice(0, 4)) {
        // 날씨에 따라 아우터 포함 여부
        if (weather.temperature <= 21.0 && outers.length > 0) {
          for (const o of outers.slice(0, 3)) {
            candidateCombinations.push({
              top: t,
              bottom: b,
              outer: o,
              shoes: activeShoes[0],
              bag: bags[0],
            });
          }
        } else {
          candidateCombinations.push({
            top: t,
            bottom: b,
            shoes: activeShoes[0],
            bag: bags[0],
          });
        }
      }
    }

    // 2. 스코어링 (5대 가중치 100점 만점 평가)
    const scoredList = candidateCombinations.map((combo, idx) => {
      const score = this.calculateScore(combo, weather, event, profile, tpoRule);
      const isFallback = score.totalScore < 70 || candidateCombinations.length === 0;

      const title = this.generateOutfitTitle(combo, event, score);
      const reasoning = this.generateReasoning(combo, weather, event, profile, tpoRule, score);

      const rec: OutfitRecommendation = {
        id: `rec-outfit-${Date.now()}-${idx}`,
        title,
        topItem: combo.top,
        bottomItem: combo.bottom,
        outerItem: combo.outer,
        shoesItem: combo.shoes,
        accessoryItem: combo.bag,
        score,
        stylistReasoning: reasoning,
        dressCode: tpoRule.dressCode,
        isFallbackApplied: isFallback,
        fallbackReason: isFallback ? '소장하신 옷장에 완벽한 매칭 아이템이 부족하여 보완 제안이 적용되었습니다.' : undefined,
      };

      return rec;
    });

    // 점수 높은 순으로 정렬 후 상위 topK개 반환
    scoredList.sort((a, b) => b.score.totalScore - a.score.totalScore);
    return scoredList.slice(0, topK);
  }

  /**
   * 1. Hard Filter: 절대적 배제 규칙
   */
  private static applyHardFilter(
    wardrobe: WardrobeItem[],
    weather: WeatherData,
    event: ScheduleEvent,
    tpoRule: any
  ): WardrobeItem[] {
    return wardrobe.filter((item) => {
      // 기온 규칙
      if (weather.temperature >= 26 && (item.subCategory === '패딩' || item.subCategory === '코트')) {
        return false;
      }
      if (weather.temperature <= 8 && (item.subCategory === '민소매' || item.subCategory === '숏팬츠' || item.subCategory === '샌들/슬리퍼')) {
        return false;
      }

      // TPO 규칙
      if (event.formalityLevel >= 4.0) {
        if (item.subCategory === '트레이닝팬츠' || item.subCategory === '샌들/슬리퍼' || item.styles.includes('스포티')) {
          return false;
        }
      }

      // 우천 규칙
      if (weather.weatherCondition === 'Rain' && item.subCategory === '스웨이드') {
        return false;
      }

      return true;
    });
  }

  /**
   * 2. 5대 가중치 스코어링 (100점 만점)
   */
  private static calculateScore(
    combo: { top: WardrobeItem; bottom?: WardrobeItem; outer?: WardrobeItem; shoes?: WardrobeItem; bag?: WardrobeItem },
    weather: WeatherData,
    event: ScheduleEvent,
    profile: UserProfile,
    tpoRule: any
  ): ScoreBreakdown {
    const items = [combo.top, combo.bottom, combo.outer, combo.shoes, combo.bag].filter(Boolean) as WardrobeItem[];

    // 1) TPO Match (30점)
    let tpoScore = 20;
    const isFormalEvent = event.formalityLevel >= 3.5;
    items.forEach((it) => {
      if (isFormalEvent && (it.styles.includes('비즈니스/출근룩') || it.styles.includes('미니멀'))) {
        tpoScore += 2;
      }
      if (!isFormalEvent && (it.styles.includes('캐주얼') || it.styles.includes('스트릿'))) {
        tpoScore += 2;
      }
    });
    tpoScore = Math.min(30, Math.max(12, tpoScore));

    // 2) Weather Match (25점)
    let weatherScore = 18;
    const isCold = weather.temperature < 15;
    if (isCold && combo.outer) weatherScore += 4;
    if (!isCold && !combo.outer && weather.temperature > 22) weatherScore += 4;
    weatherScore = Math.min(25, Math.max(10, weatherScore));

    // 3) Body Type Match (20점)
    let bodyScore = 15;
    const bodyRecs = profile.bodyAnalysis?.recommendedItems || [];
    items.forEach((it) => {
      if (bodyRecs.some((r) => it.name.includes(r) || it.subCategory?.includes(r))) {
        bodyScore += 2;
      }
    });
    bodyScore = Math.min(20, Math.max(10, bodyScore));

    // 4) Style Preference (15점)
    let styleScore = 10;
    const userStyles = profile.preferredStyles || [];
    items.forEach((it) => {
      if (it.styles.some((s) => userStyles.includes(s as any))) {
        styleScore += 1;
      }
    });
    styleScore = Math.min(15, Math.max(7, styleScore));

    // 5) Color Harmony (10점)
    let colorScore = 8;
    const allColors = items.flatMap((i) => i.colors);
    const uniqueColors = new Set(allColors);
    // 3가지 이하의 절제된 컬러 조합일 때 가산점
    if (uniqueColors.size >= 2 && uniqueColors.size <= 3) {
      colorScore = 10;
    } else if (uniqueColors.size === 1) {
      colorScore = 9;
    } else {
      colorScore = 7;
    }

    const totalScore = tpoScore + weatherScore + bodyScore + styleScore + colorScore;

    return {
      tpoMatchScore: tpoScore,
      weatherMatchScore: weatherScore,
      bodyTypeScore: bodyScore,
      stylePreferenceScore: styleScore,
      colorHarmonyScore: colorScore,
      totalScore,
    };
  }

  private static generateOutfitTitle(combo: any, event: ScheduleEvent, score: ScoreBreakdown): string {
    if (event.formalityLevel >= 4.0) {
      return `신뢰감을 주는 ${combo.outer ? combo.outer.name.split(' ')[0] : '클래식'} 비즈니스 포멀 세트`;
    } else if (event.formalityLevel >= 3.0) {
      return `단정하고 감각적인 ${combo.top.name.split(' ')[0]} 스마트 캐주얼`;
    } else {
      return `편안함과 스타일을 살린 ${combo.top.name.split(' ')[0]} 이지 데일리 룩`;
    }
  }

  private static generateReasoning(
    combo: any,
    weather: WeatherData,
    event: ScheduleEvent,
    profile: UserProfile,
    tpoRule: any,
    score: ScoreBreakdown
  ) {
    const bodyTypeName = profile.bodyAnalysis?.bodyType || '균형잡힌 체형';

    return {
      tpoReason: `${event.title}의 격식(레벨 ${event.formalityLevel.toFixed(1)})에 맞춰 '${tpoRule.dressCode}' 규격에 충실하게 조율했습니다.`,
      weatherReason: `현재 기온 ${weather.temperature}°C(체감 ${weather.feelsLike}°C)에 최적화된 소재와 ${combo.outer ? '보온 아우터 레이어드' : '통기성 쾌적 핏'}를 적용했습니다.`,
      bodyFitReason: `${bodyTypeName}에 맞춰 상하체 밸런스를 고려한 실루엣을 살려 결점을 자연스럽게 커버합니다.`,
      colorReason: `과하지 않은 ${Array.from(new Set([combo.top?.colors[0], combo.bottom?.colors[0], combo.outer?.colors[0]].filter(Boolean))).join(', ')} 컬러 배색으로 세련된 톤 조화를 이룹니다.`,
      overallReview: `총점 ${score.totalScore}점으로, 일정 TPO와 날씨, 개인 체형 장점을 극대화한 완성도 높은 스타일링입니다.`,
    };
  }
}

