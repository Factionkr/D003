import React from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  onStepClick?: (step: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Top Meta info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--primary)',
            background: 'rgba(99, 102, 241, 0.15)',
            padding: '3px 9px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sparkles size={12} /> Step {currentStep} of {totalSteps}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            {stepLabels[currentStep - 1]}
          </span>
        </div>
        <span style={{ fontSize: '13px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-muted)' }}>
          {Math.round(progressPercent)}% 완료
        </span>
      </div>

      {/* Progress Track */}
      <div style={{
        height: '6px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)',
          borderRadius: '3px',
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
        }} />
      </div>

      {/* Step Dots Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '10px'
      }}>
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: idx === 0 ? 'flex-start' : idx === stepLabels.length - 1 ? 'flex-end' : 'center',
                flex: 1,
                opacity: isCurrent ? 1 : isCompleted ? 0.85 : 0.4,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? 'var(--primary)' : isCompleted ? 'var(--success)' : 'var(--text-sub)'
              }}>
                {isCompleted ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--primary)' : 'currentColor',
                    display: 'inline-block'
                  }} />
                )}
                <span>{label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Toast Component
export interface ToastInfo {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const Toast: React.FC<{ toast: ToastInfo | null; onClose: () => void }> = ({ toast, onClose }) => {
  if (!toast) return null;

  const getColors = () => {
    switch (toast.type) {
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.92)', border: '#ef4444', icon: <AlertCircle size={18} /> };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.92)', border: '#f59e0b', icon: <AlertCircle size={18} /> };
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.92)', border: '#10b981', icon: <CheckCircle2 size={18} /> };
      default:
        return { bg: 'rgba(99, 102, 241, 0.92)', border: '#6366f1', icon: <Info size={18} /> };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 20px',
      borderRadius: '14px',
      background: colors.bg,
      color: '#fff',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${colors.border}`,
      fontSize: '14px',
      fontWeight: 500,
      animation: 'fadeIn 0.25s ease-out'
    }}>
      {colors.icon}
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        style={{
          marginLeft: '8px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px',
          lineHeight: 1,
          padding: '2px 4px'
        }}
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
};
