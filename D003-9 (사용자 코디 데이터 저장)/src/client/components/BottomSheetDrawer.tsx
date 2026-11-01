import React, { useState, useEffect, useRef } from 'react';
import { fetchArchiveDetail, updateArchive } from '../api/fitArchiveApi';
import type { FitArchiveDetail, ArchiveItem } from '../types';
import { CATEGORY_LABELS, WEATHER_ICONS, TPO_LABELS, TPO_COLORS } from '../types';
import './BottomSheetDrawer.css';

interface Props {
  archiveId: string | null;
  fitDate: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BottomSheetDrawer: React.FC<Props> = ({ archiveId, fitDate, isOpen, onClose }) => {
  const [detail, setDetail] = useState<FitArchiveDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [memo, setMemo] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!archiveId || !isOpen) return;

    (async () => {
      setLoading(true);
      try {
        const data = await fetchArchiveDetail(archiveId);
        setDetail(data);
        setSatisfaction(data.feedback?.satisfaction_score || 0);
        setMemo(data.feedback?.memo || '');
      } catch (err) {
        console.error('상세 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [archiveId, isOpen]);

  // 피드백 저장
  const handleSaveFeedback = async () => {
    if (!archiveId) return;
    try {
      const updated = await updateArchive(archiveId, {
        satisfaction_score: satisfaction || undefined,
        memo: memo || undefined,
      });
      setDetail(updated);
    } catch (err) {
      console.error('피드백 저장 실패:', err);
    }
  };

  // 바운딩 박스 핀 토글
  const handlePinClick = (item: ArchiveItem) => {
    setActivePin(activePin === item.id ? null : item.id);
  };

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sheet-handle">
          <div className="handle-bar" />
        </div>

        {loading ? (
          <div className="sheet-loading">로딩 중...</div>
        ) : detail ? (
          <div className="sheet-content">
            {/* 날짜 & 제목 */}
            <div className="sheet-header">
              <h3 className="sheet-date">{detail.fit_date}</h3>
              {detail.title && <p className="sheet-title">{detail.title}</p>}
              {detail.context?.tpo_category && (
                <span
                  className="sheet-tpo"
                  style={{ backgroundColor: TPO_COLORS[detail.context.tpo_category] }}
                >
                  {TPO_LABELS[detail.context.tpo_category]}
                </span>
              )}
            </div>

            {/* 풀사이즈 착장 이미지 (1080x1440) + 인터랙티브 핀 */}
            <div className="snapshot-container">
              <img
                src={detail.fitting_snapshot_url}
                alt={detail.title || '착장 스냅샷'}
                className="snapshot-image"
              />
              {/* Bounding Box 핀 오버레이 */}
              {detail.items
                .filter((item) => item.bounding_box)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`item-pin ${activePin === item.id ? 'active' : ''}`}
                    style={{
                      left: `${(item.bounding_box!.x + item.bounding_box!.w / 2) * 100}%`,
                      top: `${(item.bounding_box!.y + item.bounding_box!.h / 2) * 100}%`,
                    }}
                    onClick={() => handlePinClick(item)}
                  >
                    <span className="pin-dot" />
                    {activePin === item.id && (
                      <div className="pin-tooltip">
                        <strong>{item.item_name}</strong>
                        {item.brand && <span className="pin-brand">{item.brand}</span>}
                        {item.color && <span className="pin-color">{item.color}</span>}
                        {item.item_source === 'ECOMMERCE_PRODUCT' && item.product_id && (
                          <a
                            href={`/product/${item.product_id}`}
                            className="pin-buy-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🛒 구매하기
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* 착용 아이템 목록 */}
            <div className="items-section">
              <h4 className="section-title">착용 아이템</h4>
              <div className="items-list">
                {detail.items.map((item) => (
                  <div
                    key={item.id}
                    className={`item-card ${activePin === item.id ? 'highlighted' : ''}`}
                    onClick={() => handlePinClick(item)}
                  >
                    <span className="item-category">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    <div className="item-info">
                      <span className="item-name">{item.item_name}</span>
                      {item.brand && <span className="item-brand">{item.brand}</span>}
                    </div>
                    {item.color && (
                      <span className="item-color-tag">{item.color}</span>
                    )}
                    {item.item_source === 'ECOMMERCE_PRODUCT' && (
                      <span className="ecommerce-badge">🛍️</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 환경 컨텍스트 */}
            {detail.context && (
              <div className="context-section">
                <h4 className="section-title">환경 정보</h4>
                <div className="context-tags">
                  {detail.context.weather_condition && (
                    <span className="context-tag">
                      {WEATHER_ICONS[detail.context.weather_condition]}{' '}
                      {detail.context.weather_condition}
                    </span>
                  )}
                  {(detail.context.temperature_min !== undefined ||
                    detail.context.temperature_max !== undefined) && (
                    <span className="context-tag">
                      🌡️ {detail.context.temperature_min ?? '-'}°C ~{' '}
                      {detail.context.temperature_max ?? '-'}°C
                    </span>
                  )}
                  {detail.context.location_city && (
                    <span className="context-tag">📍 {detail.context.location_city}</span>
                  )}
                </div>
              </div>
            )}

            {/* 피드백 & 만족도 */}
            <div className="feedback-section">
              <h4 className="section-title">오늘의 착장 평가</h4>
              <div className="satisfaction-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star-btn ${star <= satisfaction ? 'filled' : ''}`}
                    onClick={() => setSatisfaction(star)}
                  >
                    {star <= satisfaction ? '★' : '☆'}
                  </button>
                ))}
              </div>
              <textarea
                className="memo-input"
                placeholder="착장 메모를 남겨보세요..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
              />
              <button className="save-feedback-btn" onClick={handleSaveFeedback}>
                평가 저장
              </button>
            </div>
          </div>
        ) : (
          <div className="sheet-empty">
            <p>{fitDate}에 등록된 착장이 없습니다.</p>
            <button className="add-fit-btn">+ 착장 등록하기</button>
          </div>
        )}
      </div>
    </div>
  );
};

