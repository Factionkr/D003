import React from 'react';
import { User, Calendar, ShieldCheck, Check } from 'lucide-react';
import { GENDER_OPTIONS, GenderType, NICKNAME_REGEX } from '../types/onboarding';

interface Step1BasicInfoProps {
  nickname: string;
  gender: GenderType | '';
  birthDate: string;
  onChange: (fields: { nickname?: string; gender?: GenderType; birthDate?: string }) => void;
  errors: Record<string, string>;
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  nickname,
  gender,
  birthDate,
  onChange,
  errors,
}) => {
  const isNicknameValid = NICKNAME_REGEX.test(nickname);

  // 오늘 날짜 계산 (생년월일 max값)
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
          기본 인적사항을 알려주세요
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          체형 랜드마크 분석 및 연령대별 스타일 트렌드 매핑의 기초 데이터가 됩니다.
        </p>
      </div>

      {/* 1. Nickname Input */}
      <div>
        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={15} color="var(--primary)" /> 닉네임 / 이름 <span style={{ color: 'var(--secondary)' }}>*</span>
          </span>
          <span style={{
            fontSize: '11px',
            color: nickname.length > 20 ? 'var(--danger)' : isNicknameValid ? 'var(--success)' : 'var(--text-sub)'
          }}>
            {nickname.length}/20자
          </span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="nickname-input"
            type="text"
            placeholder="예: 김스타일 (한글, 영문, 숫자 2~20자)"
            value={nickname}
            onChange={(e) => onChange({ nickname: e.target.value })}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${errors.nickname ? 'var(--danger)' : isNicknameValid ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
          {isNicknameValid && (
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)' }}>
              <Check size={16} />
            </div>
          )}
        </div>
        {errors.nickname ? (
          <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{errors.nickname}</p>
        ) : (
          <p style={{ color: 'var(--text-sub)', fontSize: '11px', marginTop: '4px' }}>
            특수문자를 제외한 한글/영문/숫자 2~20자 입력 가능
          </p>
        )}
      </div>

      {/* 2. Gender Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
          성별 <span style={{ color: 'var(--secondary)' }}>*</span>
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
            (체형 랜드마크 DB 매핑용)
          </span>
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px'
        }}>
          {GENDER_OPTIONS.map((item) => {
            const isSelected = gender === item.value;
            return (
              <button
                key={item.value}
                id={`gender-${item.value}`}
                type="button"
                className={`glass-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onChange({ gender: item.value })}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-sub)', marginTop: '2px' }}>
                    {item.description}
                  </div>
                </div>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
        {errors.gender && (
          <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{errors.gender}</p>
        )}
      </div>

      {/* 3. Birth Date Picker */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
          <Calendar size={15} color="var(--primary)" /> 생년월일 <span style={{ color: 'var(--secondary)' }}>*</span>
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
            (연령대별 스타일 트렌드 추천용)
          </span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="birthdate-input"
            type="date"
            max={todayStr}
            value={birthDate}
            onChange={(e) => onChange({ birthDate: e.target.value })}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${errors.birth_date ? 'var(--danger)' : birthDate ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              colorScheme: 'dark',
              cursor: 'pointer'
            }}
          />
        </div>
        {errors.birth_date ? (
          <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{errors.birth_date}</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-sub)', fontSize: '11px', marginTop: '4px' }}>
            <ShieldCheck size={12} /> 개인정보는 안전하게 암호화되어 의류 사이즈 및 스타일 추천에만 사용됩니다.
          </div>
        )}
      </div>
    </div>
  );
};
