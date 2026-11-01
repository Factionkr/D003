import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  GenderType,
  OccupationType,
  StyleType,
  OnboardingPayload,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
} from '../types/onboarding';
import { submitOnboardingProfile } from '../api/onboardingApi';
import { ProgressBar, Toast, ToastInfo } from './ProgressBar';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Location } from './Step2Location';
import { Step3Lifestyle } from './Step3Lifestyle';
import { Step4Style } from './Step4Style';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Code2,
} from 'lucide-react';

const STEP_LABELS = [
  '기본 정보',
  '거주지 및 환경',
  '라이프스타일',
  '취향 설정',
];

export const OnboardingContainer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedPayload, setCompletedPayload] = useState<OnboardingPayload | null>(null);

  // Form State
  const [profile, setProfile] = useState<UserProfile>({
    nickname: '',
    gender: '',
    birth_date: '',
    country: '',
    city: '',
    occupation: '',
    preferred_styles: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [limitWarning, setLimitWarning] = useState<boolean>(false);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);

  const showToast = (message: string, type: ToastInfo['type']) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Step 1 Change Handler
  const handleStep1Change = (fields: { nickname?: string; gender?: GenderType; birthDate?: string }) => {
    setProfile((prev) => ({
      ...prev,
      nickname: fields.nickname !== undefined ? fields.nickname : prev.nickname,
      gender: fields.gender !== undefined ? fields.gender : prev.gender,
      birth_date: fields.birthDate !== undefined ? fields.birthDate : prev.birth_date,
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      if (fields.nickname !== undefined) delete copy.nickname;
      if (fields.gender !== undefined) delete copy.gender;
      if (fields.birthDate !== undefined) delete copy.birth_date;
      return copy;
    });
  };

  // Step 2 Change Handler
  const handleStep2Change = (fields: { country?: string; city?: string }) => {
    setProfile((prev) => ({
      ...prev,
      country: fields.country !== undefined ? fields.country : prev.country,
      city: fields.city !== undefined ? fields.city : prev.city,
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      if (fields.country !== undefined) delete copy.country;
      if (fields.city !== undefined) delete copy.city;
      return copy;
    });
  };

  // Step 3 Change Handler
  const handleStep3Change = (occupation: OccupationType) => {
    setProfile((prev) => ({ ...prev, occupation }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.occupation;
      return copy;
    });
  };

  // Step 4 Style Tag Limit Logic (최대 3개 제한 커스텀 핸들러)
  const handleToggleStyle = (style: StyleType) => {
    setLimitWarning(false);
    const exists = profile.preferred_styles.includes(style);

    if (exists) {
      setProfile((prev) => ({
        ...prev,
        preferred_styles: prev.preferred_styles.filter((s) => s !== style),
      }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.preferred_styles;
        return copy;
      });
    } else {
      // 3개 초과 선택 시도시 방지 및 경고 노출
      if (profile.preferred_styles.length >= 3) {
        setLimitWarning(true);
        showToast('선호 스타일은 최대 3개까지만 선택 가능합니다.', 'warning');
        return;
      }
      setProfile((prev) => ({
        ...prev,
        preferred_styles: [...prev.preferred_styles, style],
      }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.preferred_styles;
        return copy;
      });
    }
  };

  // Current Step Validation Logic
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1: {
        const res = step1Schema.safeParse({
          nickname: profile.nickname,
          gender: profile.gender,
          birth_date: profile.birth_date,
        });
        return res.success;
      }
      case 2: {
        const res = step2Schema.safeParse({
          country: profile.country,
          city: profile.city,
        });
        return res.success;
      }
      case 3: {
        const res = step3Schema.safeParse({
          occupation: profile.occupation,
        });
        return res.success;
      }
      case 4: {
        const res = step4Schema.safeParse({
          preferred_styles: profile.preferred_styles,
        });
        return res.success;
      }
      default:
        return false;
    }
  }, [currentStep, profile]);

  // Next Step Action
  const handleNext = () => {
    // 폼 검증 실행
    if (currentStep === 1) {
      const res = step1Schema.safeParse({
        nickname: profile.nickname,
        gender: profile.gender,
        birth_date: profile.birth_date,
      });
      if (!res.success) {
        const stepErrors: Record<string, string> = {};
        res.error.errors.forEach((err) => {
          stepErrors[err.path[0] as string] = err.message;
        });
        setErrors(stepErrors);
        showToast('입력하신 기본 정보를 다시 확인해주세요.', 'error');
        return;
      }
    } else if (currentStep === 2) {
      const res = step2Schema.safeParse({
        country: profile.country,
        city: profile.city,
      });
      if (!res.success) {
        const stepErrors: Record<string, string> = {};
        res.error.errors.forEach((err) => {
          stepErrors[err.path[0] as string] = err.message;
        });
        setErrors(stepErrors);
        showToast('국가와 도시를 모두 선택해주세요.', 'error');
        return;
      }
    } else if (currentStep === 3) {
      const res = step3Schema.safeParse({
        occupation: profile.occupation,
      });
      if (!res.success) {
        const stepErrors: Record<string, string> = {};
        res.error.errors.forEach((err) => {
          stepErrors[err.path[0] as string] = err.message;
        });
        setErrors(stepErrors);
        showToast('직업군을 하나 선택해주세요.', 'error');
        return;
      }
    }

    setErrors({});
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setLimitWarning(false);
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Submit Handler
  const handleSubmit = async () => {
    const res = step4Schema.safeParse({
      preferred_styles: profile.preferred_styles,
    });
    if (!res.success) {
      const stepErrors: Record<string, string> = {};
      res.error.errors.forEach((err) => {
        stepErrors[err.path[0] as string] = err.message;
      });
      setErrors(stepErrors);
      showToast('최소 1개 이상의 스타일을 선택해주세요 (최대 3개).', 'error');
      return;
    }

    setIsSubmitting(true);

    const payload: OnboardingPayload = {
      user_id: 'usr_' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '_001',
      profile: {
        nickname: profile.nickname,
        gender: profile.gender as GenderType,
        birth_date: profile.birth_date,
        country: profile.country,
        city: profile.city,
        occupation: profile.occupation as OccupationType,
        preferred_styles: profile.preferred_styles,
      },
      created_at: new Date().toISOString(),
    };

    try {
      const response = await submitOnboardingProfile(payload);
      if (response.success && response.data) {
        setCompletedPayload(response.data);
        showToast('🎉 프로필 설정 완료! AI 체형 피팅 스튜디오로 이동합니다.', 'success');
      } else {
        showToast(response.message || '저장에 실패했습니다.', 'error');
      }
    } catch {
      showToast('네트워크 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset demo
  const handleReset = () => {
    setCompletedPayload(null);
    setCurrentStep(1);
    setProfile({
      nickname: '',
      gender: '',
      birth_date: '',
      country: '',
      city: '',
      occupation: '',
      preferred_styles: [],
    });
    setErrors({});
  };

  // Prefill Sample Data (개발/데모 편의용)
  const handlePrefillSample = () => {
    setProfile({
      nickname: '김스타일',
      gender: 'female',
      birth_date: '1998-05-20',
      country: 'KR',
      city: 'Goyang-si',
      occupation: 'office_worker',
      preferred_styles: ['minimal', 'business_casual', 'street'],
    });
    showToast('샘플 명세서 데이터가 입력되었습니다.', 'info');
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px' }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header Branding */}
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          color: 'var(--primary)',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '12px',
          letterSpacing: '0.5px'
        }}>
          <Sparkles size={14} /> AI FIT & VIRTUAL STYLING
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          체형 분석 & 피팅 프로필 설정
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          당신의 체형과 일상에 가장 최적화된 맞춤형 가상 의류 피팅 솔루션을 시작합니다.
        </p>

        {/* Quick Demo Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={handlePrefillSample}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sliders size={12} /> 명세서 샘플 데이터 자동 채우기
          </button>
          <button
            type="button"
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: showJsonInspector ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: showJsonInspector ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Code2 size={12} /> 실시간 JSON 상태 보기
          </button>
        </div>
      </header>

      {/* Live JSON Inspector (Collapsible) */}
      {showJsonInspector && (
        <div style={{
          marginBottom: '20px',
          background: 'rgba(10, 12, 16, 0.95)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#38bdf8',
          maxHeight: '180px',
          overflowY: 'auto'
        }}>
          <div style={{ color: 'var(--text-sub)', marginBottom: '4px', fontWeight: 600 }}>// 현재 폼 실시간 상태 (Live State):</div>
          <pre>{JSON.stringify({ ...profile, currentStep }, null, 2)}</pre>
        </div>
      )}

      {/* Main Glass Panel Card */}
      <main className="glass-panel" style={{ padding: '32px 28px' }}>
        {!completedPayload ? (
          <div>
            {/* Step Progress Bar */}
            <ProgressBar
              currentStep={currentStep}
              totalSteps={4}
              stepLabels={STEP_LABELS}
            />

            {/* Step Forms */}
            <div style={{ minHeight: '340px' }}>
              {currentStep === 1 && (
                <Step1BasicInfo
                  nickname={profile.nickname}
                  gender={profile.gender}
                  birthDate={profile.birth_date}
                  onChange={handleStep1Change}
                  errors={errors}
                />
              )}

              {currentStep === 2 && (
                <Step2Location
                  country={profile.country}
                  city={profile.city}
                  onChange={handleStep2Change}
                  errors={errors}
                />
              )}

              {currentStep === 3 && (
                <Step3Lifestyle
                  occupation={profile.occupation}
                  onChange={handleStep3Change}
                  errors={errors}
                />
              )}

              {currentStep === 4 && (
                <Step4Style
                  preferredStyles={profile.preferred_styles}
                  onToggleStyle={handleToggleStyle}
                  errors={errors}
                  limitWarning={limitWarning}
                />
              )}
            </div>

            {/* Step Navigation Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '36px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {currentStep > 1 ? (
                <button
                  type="button"
                  id="prev-step-btn"
                  onClick={handlePrev}
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ArrowLeft size={16} /> 이전 단계
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  id="next-step-btn"
                  onClick={handleNext}
                  disabled={!isStepValid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 28px',
                    borderRadius: 'var(--radius-md)',
                    background: isStepValid
                      ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: isStepValid ? '#fff' : 'var(--text-sub)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isStepValid ? 'pointer' : 'not-allowed',
                    boxShadow: isStepValid ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  다음 단계 <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  id="submit-profile-btn"
                  onClick={handleSubmit}
                  disabled={!isStepValid || isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '13px 32px',
                    borderRadius: 'var(--radius-md)',
                    background: isStepValid && !isSubmitting
                      ? 'linear-gradient(135deg, #ec4899, #6366f1)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: isStepValid ? '#fff' : 'var(--text-sub)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isStepValid && !isSubmitting ? 'pointer' : 'not-allowed',
                    boxShadow: isStepValid ? '0 6px 20px rgba(236, 72, 153, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> 전송 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> 프로필 저장 및 시작하기
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Completion & Success Screen */
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2))',
              border: '2px solid var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: 'var(--success)'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              온보딩 프로필 설정 완료!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              백엔드 DB에 정상 저장되었으며, <strong>{completedPayload.profile.nickname}</strong> 님의 맞춤형 체형 피팅 알고리즘 엔진이 활성화되었습니다.
            </p>

            {/* Stored JSON Specification Display */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '28px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-sub)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '8px',
                marginBottom: '10px'
              }}>
                <span>API Endpoint: <code>POST /api/v1/onboarding/profile</code></span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>201 CREATED</span>
              </div>
              <pre style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#34d399',
                overflowX: 'auto',
                lineHeight: 1.5
              }}>
                {JSON.stringify(completedPayload, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={15} /> 다른 프로필로 다시 테스트
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Meta */}
      <footer style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-sub)' }}>
        AI Virtual Fitting & Body Measurement Engine • v1.0.0
      </footer>
    </div>
  );
};
