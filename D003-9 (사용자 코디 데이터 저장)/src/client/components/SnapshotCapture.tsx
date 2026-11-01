import React, { useRef, useCallback } from 'react';

interface CaptureResult {
  blob: Blob;
  dataUrl: string;
}

interface Props {
  /** 캔버스 또는 렌더링 대상 컨테이너의 ref */
  targetRef: React.RefObject<HTMLElement>;
  /** 캡처 완료 콜백 */
  onCapture: (result: CaptureResult) => void;
  children?: React.ReactNode;
}

const SNAPSHOT_WIDTH = 1080;
const SNAPSHOT_HEIGHT = 1440;

/**
 * 렌더링된 최종 합성 장면을 4:3 비율(1080x1440) WebP 스냅샷으로
 * 추출하는 클라이언트 캡처 컴포넌트
 */
export const SnapshotCapture: React.FC<Props> = ({ targetRef, onCapture, children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureSnapshot = useCallback(async () => {
    const target = targetRef.current;
    if (!target || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = SNAPSHOT_WIDTH;
    canvas.height = SNAPSHOT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // html2canvas 또는 native canvas 방식으로 렌더링 대상을 캡처
    try {
      // @ts-ignore - dynamic import for html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const sourceCanvas = await html2canvas(target, {
        width: target.offsetWidth,
        height: target.offsetHeight,
        useCORS: true,
        allowTaint: false,
        scale: 2,
      });

      // 4:3 비율로 리사이즈하여 그리기
      ctx.drawImage(sourceCanvas, 0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
    } catch {
      // fallback: 대상이 canvas인 경우 직접 복사
      if (target instanceof HTMLCanvasElement) {
        ctx.drawImage(target, 0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
      } else {
        console.error('스냅샷 캡처 실패: html2canvas를 로드할 수 없습니다.');
        return;
      }
    }

    // WebP Blob 생성
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        onCapture({ blob, dataUrl });
      },
      'image/webp',
      0.85
    );
  }, [targetRef, onCapture]);

  return (
    <>
      {children}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button className="capture-btn" onClick={captureSnapshot}>
        📸 착장 스냅샷 저장
      </button>
    </>
  );
};

