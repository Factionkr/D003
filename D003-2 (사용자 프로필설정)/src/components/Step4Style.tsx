import { Check, AlertTriangle, Flame } from 'lucide-react';
import { STYLE_OPTIONS, StyleType } from '../types/onboarding';

interface Step4StyleProps {
  preferredStyles: StyleType[];
  onToggleStyle: (style: StyleType) => void;
  errors: Record<string, string>;
  limitWarning: boolean;
}

export const Step4Style: React.FC<Step4StyleProps> = ({
  preferredStyles,
  onToggleStyle,
  errors,
  limitWarning,
}) => {
  const selectedCount = preferredStyles.length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
              선호하는 스타일 취향을 선택해주세요
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              가상 피팅 추천 알고리즘에 가중치를 부여하여 가장 어울리는 실루엣을 생성합니다.
            </p>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '16px',
            background: selectedCount === 3 ? 'rgba(236, 72, 153, 0.2)' : 'rgba(99, 102, 241, 0.15)',
            border: selectedCount === 3 ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(99, 102, 241, 0.3)',
            color: selectedCount === 3 ? 'var(--secondary)' : 'var(--primary)',
            whiteSpace: 'nowrap'
          }}>
            {selectedCount} / 3 선택됨
          </div>
        </div>

        {/* 3개 초과 경고 메시지 배너 */}
        {limitWarning && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #f59e0b',
            color: '#fbbf24',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            <AlertTriangle size={16} />
            <span>스타일 취향은 <strong>최대 3개</strong>까지만 선택할 수 있습니다. 변경하려면 기존 선택 항목을 해제해주세요.</span>
          </div>
        )}
      </div>

      {/* Style Chips Grid (다중 선택 Chip UI) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {STYLE_OPTIONS.map((item) => {
          const isSelected = preferredStyles.includes(item.value);
          const isMaxReached = selectedCount >= 3 && !isSelected;

          return (
            <button
              key={item.value}
              id={`style-${item.value}`}
              type="button"
              onClick={() => onToggleStyle(item.value)}
              className={`glass-chip ${isSelected ? 'active' : ''}`}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'left',
                opacity: isMaxReached ? 0.6 : 1,
                cursor: 'pointer',
                position: 'relative',
                minHeight: '110px',
                border: isSelected
                  ? '1.5px solid var(--secondary)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                background: isSelected
                  ? 'linear-gradient(145deg, rgba(236, 72, 153, 0.22), rgba(99, 102, 241, 0.22))'
                  : 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                    {item.label}
                  </span>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `1.5px solid ${isSelected ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.2)'}`,
                    background: isSelected ? 'var(--secondary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: isSelected ? 'var(--secondary)' : 'var(--accent-cyan)',
                  fontWeight: 600,
                  marginBottom: '6px'
                }}>
                  {item.tag}
                </div>
              </div>

              <div style={{
                fontSize: '11px',
                color: isSelected ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-sub)',
                lineHeight: 1.3
              }}>
                {item.example}
              </div>
            </button>
          );
        })}
      </div>

      {errors.preferred_styles && (
        <p style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.preferred_styles}</p>
      )}

      {/* Weighting preview card */}
      <div style={{
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(99, 102, 241, 0.06)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Flame size={24} color="var(--secondary)" />
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          <strong style={{ color: '#fff' }}>취향 가중치 알고리즘:</strong> 선택하신 스타일 태그(최대 3개)를 기반으로
          AI가 체형에 가장 슬림하고 자연스러운 의류 패턴 및 텍스처를 우선 추천합니다.
        </div>
      </div>
    </div>
  );
};
