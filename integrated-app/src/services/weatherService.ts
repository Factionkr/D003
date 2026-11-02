import { WeatherData, WeatherStylingGuide } from '../types';

export class WeatherService {
  /**
   * 3.4 기온 구간별 대표 의류 및 스타일링 가이드 (D003-3 표준 규격)
   */
  public static readonly TEMP_GUIDELINES: WeatherStylingGuide[] = [
    {
      minTemp: 28.0,
      maxTemp: 99.0,
      recommendedText: '민소매, 반팔, 숏팬츠, 린넨 원피스, 샌들, 통기성 우수 소재',
      keyCategories: ['top', 'pants', 'skirt', 'shoes'],
      stylingAdvice: '체감온도가 높은 한여름 날씨입니다. 린넨/시어서커 등 흡습속건 소재와 자외선 차단 선글라스를 챙기세요.'
    },
    {
      minTemp: 23.0,
      maxTemp: 27.9,
      recommendedText: '반팔티, 얇은 셔츠, 면바지, 슬랙스, 반바지',
      keyCategories: ['top', 'pants'],
      stylingAdvice: '활동하기 좋은 초여름/초가을 날씨입니다. 가벼운 셔츠나 면바지로 쾌적한 캐주얼 룩을 연출하세요.'
    },
    {
      minTemp: 20.0,
      maxTemp: 22.9,
      recommendedText: '긴팔티, 가디건, 후드티, 청바지, 면바지, 슬랙스',
      keyCategories: ['top', 'outer', 'pants'],
      stylingAdvice: '일교차가 시작되는 간절기입니다. 낮에는 단품 상의, 아침저녁 쌀쌀할 때 걸칠 수 있는 가디건이 유용합니다.'
    },
    {
      minTemp: 17.0,
      maxTemp: 19.9,
      recommendedText: '니트, 맨투맨, 가디건, 자켓, 청바지, 자켓 레이어드',
      keyCategories: ['top', 'outer', 'pants'],
      stylingAdvice: '완연한 가을/봄 날씨입니다. 맨투맨이나 얇은 니트에 테일러드 자켓을 레이어드하기 가장 좋습니다.'
    },
    {
      minTemp: 12.0,
      maxTemp: 16.9,
      recommendedText: '자켓, 트렌치코트, 야상, 니트, 청바지, 스타킹',
      keyCategories: ['outer', 'top', 'pants'],
      stylingAdvice: '바람이 불면 다소 쌀쌀합니다. 트렌치코트나 사파리 자켓 등 클래식한 아우터로 보온성을 갖추세요.'
    },
    {
      minTemp: 9.0,
      maxTemp: 11.9,
      recommendedText: '트렌치코트, 야상, 자켓, 도톰한 니트, 방풍 아우터',
      keyCategories: ['outer', 'top', 'pants'],
      stylingAdvice: '기온이 10도 안팎으로 떨어집니다. 이너를 도톰하게 입거나 가죽자켓/울블렌드 아우터를 추천합니다.'
    },
    {
      minTemp: 5.0,
      maxTemp: 8.9,
      recommendedText: '울 코트, 가죽 자켓, 히트텍, 니트, 레깅스, 경량 패딩',
      keyCategories: ['outer', 'top', 'pants', 'shoes'],
      stylingAdvice: '초겨울 추위가 느껴집니다. 울 코트나 경량 다운패딩, 머플러로 목을 감싸 체온을 유지하세요.'
    },
    {
      minTemp: -50.0,
      maxTemp: 4.9,
      recommendedText: '롱패딩, 두꺼운 코트, 목도리, 장갑, 기모 안감 제품, 방한부츠',
      keyCategories: ['outer', 'top', 'pants', 'etc', 'shoes'],
      stylingAdvice: '한파가 매섭습니다. 헤비 다운 패딩, 방한 장갑, 기모 안감 팬츠로 완전 방한 무장을 권장합니다.'
    }
  ];

  /**
   * 기온에 해당하는 스타일 가이드라인 반환
   */
  public static getGuideline(temperature: number): WeatherStylingGuide {
    for (const guide of this.TEMP_GUIDELINES) {
      if (temperature >= guide.minTemp && temperature <= guide.maxTemp) {
        return guide;
      }
    }
    return this.TEMP_GUIDELINES[this.TEMP_GUIDELINES.length - 1];
  }

  /**
   * 체감온도(Wind Chill / Steadman) 계산 공식
   */
  public static calculateFeelsLike(temp: number, windSpeed: number, humidity: number): number {
    if (temp <= 10 && windSpeed > 1.3) {
      // 바람 냉각 체감온도 공식
      const v = Math.pow(windSpeed * 3.6, 0.16);
      const chill = 13.12 + 0.6215 * temp - 11.37 * v + 0.3965 * temp * v;
      return Math.round(chill * 10) / 10;
    } else {
      // 습도 기반 열지수 추정
      const e = (humidity / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
      const feels = temp + 0.33 * e - 0.7 * windSpeed - 4.0;
      return Math.round(feels * 10) / 10;
    }
  }

  /**
   * 도시별 기본 프리셋 날씨 데이터 (오프라인/즉시 로드 지원)
   */
  public static getCityWeather(cityName: string = '서울특별시'): WeatherData {
    const cityMap: Record<string, Partial<WeatherData>> = {
      '서울특별시': { temperature: 16.5, humidity: 48, windSpeed: 2.1, weatherCondition: 'Clear', conditionKorean: '맑음' },
      '부산광역시': { temperature: 19.2, humidity: 55, windSpeed: 3.5, weatherCondition: 'Clear', conditionKorean: '쾌청함' },
      '제주시': { temperature: 20.1, humidity: 62, windSpeed: 4.2, weatherCondition: 'Clouds', conditionKorean: '구름 조금' },
      'Tokyo': { temperature: 17.8, humidity: 52, windSpeed: 2.4, weatherCondition: 'Clear', conditionKorean: '맑음' },
      'New York': { temperature: 13.4, humidity: 65, windSpeed: 4.8, weatherCondition: 'Rain', conditionKorean: '비 내림' },
      'Paris': { temperature: 11.2, humidity: 70, windSpeed: 3.1, weatherCondition: 'Clouds', conditionKorean: '흐림' },
      'London': { temperature: 9.8, humidity: 78, windSpeed: 4.5, weatherCondition: 'Rain', conditionKorean: '이슬비' }
    };

    const base = cityMap[cityName] || cityMap['서울특별시'];
    const temp = base.temperature || 17.0;
    const wind = base.windSpeed || 2.5;
    const hum = base.humidity || 50;

    return {
      city: cityName,
      temperature: temp,
      feelsLike: this.calculateFeelsLike(temp, wind, hum),
      humidity: hum,
      weatherCondition: (base.weatherCondition as any) || 'Clear',
      conditionKorean: base.conditionKorean || '맑음',
      windSpeed: wind,
      precipitationProb: base.weatherCondition === 'Rain' ? 85 : 15,
      minTemp: Math.round((temp - 4) * 10) / 10,
      maxTemp: Math.round((temp + 3) * 10) / 10,
      updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

