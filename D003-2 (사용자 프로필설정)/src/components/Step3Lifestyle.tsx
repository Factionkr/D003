import React from 'react';
import {
  GraduationCap,
  Briefcase,
  Laptop,
  Users,
  Store,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { OCCUPATION_OPTIONS, OccupationType } from '../types/onboarding';

interface Step3LifestyleProps {
  occupation: OccupationType | '';
  onChange: (occupation: OccupationType) => void;
  errors: Record<string, string>;
}

export const Step3Lifestyle: React.FC<Step3LifestyleProps> = ({
  occupation,
  onChange,
  errors,
}) => {
  const getIcon = (iconName: string, isSelected: boolean) => {
    const color = isSelected ? '#fff' : 'var(--primary)';
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap size={20} color={color} />;
      case 'Briefcase':
        return <Briefcase size={20} color={color} />;
      case 'Laptop':
        return <Laptop size={20} color={color} />;
      case 'Users':
        return <Users size={20} color={color} />;
      case 'Store':
        return <Store size={20} color={color} />;
      default:
        return <Sparkles size={20} color={color} />;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
          현재 주 활동 영역 / 직업군을 선택해주세요
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          출근룩, 캠퍼스룩, 미팅 등 일상 TPO(Time, Place, Occasion)에 최적화된 피팅 스타일을 제안합니다.
        </p>
      </div>

      {/* Occupation Single Select Chip Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: '12px'
      }}>
        {OCCUPATION_OPTIONS.map((item) => {
          const isSelected = occupation === item.value;
          return (
            <button
              key={item.value}
              id={`occ-${item.value}`}
              type="button"
              className={`glass-chip ${isSelected ? 'active' : ''}`}
              onClick={() => onChange(item.value)}
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                border: isSelected
                  ? '1.5px solid var(--primary)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: isSelected ? 'var(--primary)' : 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.2s ease'
                }}>
                  {getIcon(item.icon, isSelected)}
                </div>
                <div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isSelected ? '#fff' : 'var(--text-main)',
                    marginBottom: '3px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)'
                  }}>
                    {item.desc}
                  </div>
                </div>
              </div>

              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                background: isSelected ? 'var(--primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0
              }}>
                {isSelected && <CheckCircle2 size={16} />}
              </div>
            </button>
          );
        })}
      </div>

      {errors.occupation && (
        <p style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.occupation}</p>
      )}

      {/* Info footer */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '12px',
        color: 'var(--text-sub)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        💡 직업군은 출근/업무 환경에 맞는 기본 의류 카테고리(정장 실루엣 vs 캐주얼 실루엣) 필터링에 활용됩니다.
      </div>
    </div>
  );
};
