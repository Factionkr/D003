import { BodyLandmarks, BodyType, BodyAnalysisResult } from '../types';

export class BodyAnalysisService {
  private static TOLERANCE = 0.08;

  /**
   * 랜드마크 기반 체형 분석 및 치수 비율 계산 (D003-1 알고리즘)
   */
  public static analyze(landmarks: BodyLandmarks): BodyAnalysisResult {
    const ls = landmarks.left_shoulder;
    const rs = landmarks.right_shoulder;
    const shoulderWidth = Math.abs(rs[0] - ls[0]);

    const lh = landmarks.left_hip;
    const rh = landmarks.right_hip;
    const hipWidth = Math.abs(rh[0] - lh[0]);

    const lw = landmarks.left_waist;
    const rw = landmarks.right_waist;
    const waistWidth = lw && rw ? Math.abs(rw[0] - lw[0]) : ((shoulderWidth + hipWidth) / 2) * 0.8;

    const shoulderHipRatio = hipWidth > 0 ? shoulderWidth / hipWidth : 1.0;
    const waistHipRatio = hipWidth > 0 ? waistWidth / hipWidth : 0.8;

    // 체형 판정
    let bodyType: BodyType = '직사각형';

    if (waistWidth > shoulderWidth && waistWidth > hipWidth) {
      bodyType = '라운드형';
    } else if (Math.abs(shoulderWidth - hipWidth) <= this.TOLERANCE * Math.max(shoulderWidth, hipWidth)) {
      if (waistHipRatio < 0.78) {
        bodyType = '모래시계형';
      } else {
        bodyType = '직사각형';
      }
    } else if (shoulderWidth > hipWidth * (1.0 + this.TOLERANCE)) {
      bodyType = '역삼각형';
    } else if (hipWidth > shoulderWidth * (1.0 + this.TOLERANCE)) {
      bodyType = '삼각형(A라인)';
    }

    const { stylingTips, recommendedItems, avoidItems } = this.getStylingGuide(bodyType);

    return {
      bodyType,
      metrics: {
        shoulderWidth: Math.round(shoulderWidth * 100),
        hipWidth: Math.round(hipWidth * 100),
        waistWidth: Math.round(waistWidth * 100),
        torsoRatio: 1.0,
        shoulderHipRatio: parseFloat(shoulderHipRatio.toFixed(2)),
        waistHipRatio: parseFloat(waistHipRatio.toFixed(2)),
      },
      stylingTips,
      recommendedItems,
      avoidItems,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * 5대 체형별 최적 스타일링 조언 및 추천 의류 매핑 (D003-1 Styling Recommendation Engine)
   */
  public static getStylingGuide(bodyType: BodyType) {
    switch (bodyType) {
      case '모래시계형':
        return {
          stylingTips: [
            '균형 잡힌 상하체와 슬림한 허리선을 자연스럽게 강조하세요.',
            '허리 라인을 잡아주는 랩 원피스나 벨티드 아우터가 베스트입니다.',
            '과도한 박시핏보다는 신체 실루엣을 살려주는 레귤러/슬림핏 추천.'
          ],
          recommendedItems: ['랩 드레스', 'V넥 니트', '하이웨이스트 와이드 팬츠', '벨티드 트렌치코트', '크롭 자켓'],
          avoidItems: ['통짜 실루엣 박시 티셔츠', '디테일이 너무 과한 오버핏 패딩']
        };
      case '역삼각형':
        return {
          stylingTips: [
            '넓은 어깨를 소프트하게 분산하고 하체에 볼륨감을 더하세요.',
            '상의는 심플한 V넥이나 래글런 슬리브를 선택하고, 어깨 패드는 피하세요.',
            'A라인 스커트나 와이드 카고 팬츠로 하체 실루엣에 안정감을 부여하세요.'
          ],
          recommendedItems: ['A라인 스커트', '와이드 데님 팬츠', 'U넥/V넥 셔츠', '플리츠 스커트', '드롭 숄더 니트'],
          avoidItems: ['어깨 패드 각진 블레이저', '보트넥 상의', '스키니진']
        };
      case '삼각형(A라인)':
        return {
          stylingTips: [
            '골반과 하체에 비해 좁은 어깨와 상체에 시선을 분산시키세요.',
            '상의에 디테일(보트넥, 퍼프 슬리브, 셔링)이나 밝은 컬러를 활용하세요.',
            '하의는 어두운 톤의 스트레이트/테이퍼드 슬랙스로 슬림하게 연출하세요.'
          ],
          recommendedItems: ['테일러드 자켓', '보트넥 니트', '스트레이트 슬랙스', '셔츠 레이어드', '롱 코트'],
          avoidItems: ['타이트한 밝은색 레깅스/팬츠', '밑단에 큰 장식이 들어간 스커트']
        };
      case '직사각형':
        return {
          stylingTips: [
            '허리선이 밋밋할 수 있으므로 시각적인 입체감과 곡선을 형성하세요.',
            '크롭 상의와 하이웨이스트 하의 조합으로 상하체 비율을 분할하세요.',
            '벨트나 턱인(Tuck-in) 스타일링으로 허리 포인트를 주면 실루엣이 살아납니다.'
          ],
          recommendedItems: ['벨티드 슬랙스', '크롭 가디건', '페플럼 블라우스', '플레어 스커트', '오버핏 자켓'],
          avoidItems: ['허리선 없는 일자 통원피스', '단조로운 스트레이트 실루엣 풀착장']
        };
      case '라운드형':
      default:
        return {
          stylingTips: [
            '복부 라인을 커버하고 세로 방향의 직선 실루엣으로 길어보이게 유도하세요.',
            '오픈형 롱 가디건이나 버티컬 스트라이프 자켓이 체형 커버에 탁월합니다.',
            '목선이 드러나는 V넥/오픈 칼라 셔츠로 시원한 인상을 연출하세요.'
          ],
          recommendedItems: ['오픈형 롱 가디건', 'V넥 튜닉 블라우스', '루즈핏 셔츠', '다크톤 세미와이드 슬랙스', '싱글 롱코트'],
          avoidItems: ['허리를 강하게 조이는 벨트', '복부에 큰 포켓이 달린 상의']
        };
    }
  }

  /**
   * 기본 체형 프리셋 랜드마크 생성 (테스트/시뮬레이션용)
   */
  public static getPresetLandmarks(type: BodyType): BodyLandmarks {
    switch (type) {
      case '모래시계형':
        return {
          left_shoulder: [0.38, 0.28],
          right_shoulder: [0.62, 0.28],
          left_waist: [0.44, 0.45],
          right_waist: [0.56, 0.45],
          left_hip: [0.38, 0.55],
          right_hip: [0.62, 0.55],
        };
      case '역삼각형':
        return {
          left_shoulder: [0.34, 0.28],
          right_shoulder: [0.66, 0.28],
          left_waist: [0.43, 0.45],
          right_waist: [0.57, 0.45],
          left_hip: [0.42, 0.55],
          right_hip: [0.58, 0.55],
        };
      case '삼각형(A라인)':
        return {
          left_shoulder: [0.41, 0.28],
          right_shoulder: [0.59, 0.28],
          left_waist: [0.42, 0.45],
          right_waist: [0.58, 0.45],
          left_hip: [0.36, 0.55],
          right_hip: [0.64, 0.55],
        };
      case '라운드형':
        return {
          left_shoulder: [0.39, 0.28],
          right_shoulder: [0.61, 0.28],
          left_waist: [0.37, 0.45],
          right_waist: [0.63, 0.45],
          left_hip: [0.39, 0.55],
          right_hip: [0.61, 0.55],
        };
      case '직사각형':
      default:
        return {
          left_shoulder: [0.38, 0.28],
          right_shoulder: [0.62, 0.28],
          left_waist: [0.40, 0.45],
          right_waist: [0.60, 0.45],
          left_hip: [0.39, 0.55],
          right_hip: [0.61, 0.55],
        };
    }
  }
}

