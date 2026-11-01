import { OnboardingPayload, ApiResponse, fullProfileSchema } from '../types/onboarding';

const STORAGE_KEY = 'ai_fit_user_profile';

/**
 * 모킹 API: POST /api/v1/onboarding/profile
 * 실제 네트워크 요청처럼 지연시간(Latency)과 유효성 검사, 로컬 저장소 저장을 시뮬레이션합니다.
 */
export async function submitOnboardingProfile(
  payload: OnboardingPayload
): Promise<ApiResponse<OnboardingPayload>> {
  // 인위적 지연 800ms
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Zod 기반 런타임 유효성 검사
  const validation = fullProfileSchema.safeParse(payload);
  if (!validation.success) {
    const errorDetails: Record<string, string[]> = {};
    validation.error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!errorDetails[path]) errorDetails[path] = [];
      errorDetails[path].push(err.message);
    });

    return {
      success: false,
      message: '프로필 유효성 검사에 실패했습니다.',
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력된 프로필 정보 중 올바르지 않은 항목이 있습니다.',
        details: errorDetails,
      },
    };
  }

  // 성공 시 로컬 브라우저 저장소(Mock DB)에 저장
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors in mock
  }

  return {
    success: true,
    message: '프로필이 성공적으로 등록되었습니다. AI 체형 분석을 시작합니다.',
    data: payload,
  };
}

/**
 * 저장된 프로필 가져오기 (마이페이지/수정 시뮬레이션용)
 */
export function getSavedProfile(): OnboardingPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
