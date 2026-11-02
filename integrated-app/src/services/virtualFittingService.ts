import { VTONModel, VirtualFittingResult, WardrobeItem } from '../types';

export class VirtualFittingService {
  /**
   * D003-6 가상 피팅 4단계 통합 파이프라인 시뮬레이션 및 렌더링
   */
  public static async executeFitting(
    avatarUrl: string,
    garments: WardrobeItem[],
    modelType: VTONModel = 'IDM-VTON',
    onProgress?: (stage: string, progress: number) => void
  ): Promise<VirtualFittingResult> {
    const startTime = performance.now();

    // Stage 1: Pose Analysis
    onProgress?.('Stage 1: 사용자 이미지 포즈 및 신체 랜드마크 분석 중...', 25);
    await this.delay(350);

    // Stage 2: Garment Segmentation
    onProgress?.('Stage 2: 의류 영역 세그멘테이션 및 마스킹 처리 중...', 50);
    await this.delay(350);

    // Stage 3: Garment Warping
    onProgress?.('Stage 3: 신체 굴곡에 맞춘 의류 TPS 워핑 및 변형...', 75);
    await this.delay(400);

    // Stage 4: Diffusion Blending
    onProgress?.(`Stage 4: ${modelType} 디퓨전 텍스처 블렌딩 및 디테일 보정...`, 95);
    await this.delay(450);

    const endTime = performance.now();
    const duration = parseFloat(((endTime - startTime) / 1000).toFixed(2));

    // 정렬: 상의(1), 하의(2), 아우터(3), 신발(4), 악세서리(5)
    const sortedGarments = [...garments].sort((a, b) => {
      const order: Record<string, number> = { top: 1, onepiece: 1, pants: 2, skirt: 2, outer: 3, shoes: 4, bag: 5, etc: 6 };
      return (order[a.category] || 9) - (order[b.category] || 9);
    });

    onProgress?.('가상 피팅 완료!', 100);

    return {
      jobId: `vton-job-${Date.now()}`,
      vtonModel: modelType,
      userAvatarUrl: avatarUrl,
      // 피팅된 결과 이미지는 첫 번째 아이템의 고화질 이미지나 아바타 융합 이미지 생성
      fittedResultUrl: garments.find((g) => g.category === 'outer')?.imageUrl || garments[0]?.imageUrl || avatarUrl,
      fittedGarments: sortedGarments.map((g, idx) => ({
        itemId: g.id,
        name: g.name,
        category: g.category,
        layerOrder: idx + 1,
      })),
      metrics: {
        inferenceTimeSec: duration,
        resolution: '1024x1536 (HD)',
        idPreservationScore: 0.94,
      },
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    };
  }

  private static delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

