import React, { useState, useEffect } from 'react';
import { fetchMonthlyStats } from '../api/fitArchiveApi';
import type { MonthlyStats } from '../types';
import { CATEGORY_LABELS } from '../types';
import './MonthlyStatsReport.css';

interface Props {
  year: number;
  month: number;
}

export const MonthlyStatsReport: React.FC<Props> = ({ year, month }) => {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchMonthlyStats(year, month);
        setStats(data);
      } catch (err) {
        console.error('통계 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [year, month]);

  if (loading) return <div className="stats-loading">통계 로딩 중...</div>;
  if (!stats) return null;

  const wornRate =
    stats.total_fits > 0
      ? Math.round((stats.worn_count / stats.total_fits) * 100)
      : 0;

  return (
    <div className="stats-container">
      <h3 className="stats-title">
        {year}년 {month}월 착용 리포트
      </h3>

      {/* Summary Cards */}
      <div className="stats-summary">
        <div className="summary-card">
          <span className="summary-value">{stats.total_fits}</span>
          <span className="summary-label">총 착장</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{wornRate}%</span>
          <span className="summary-label">실착용률</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">
            {stats.avg_satisfaction !== null ? `${stats.avg_satisfaction}` : '-'}
          </span>
          <span className="summary-label">평균 만족도</span>
        </div>
      </div>

      {/* Top Categories (Bar chart) */}
      {stats.top_categories.length > 0 && (
        <div className="stats-section">
          <h4 className="section-label">자주 입은 카테고리</h4>
          <div className="bar-chart">
            {stats.top_categories.map((c) => {
              const maxCount = stats.top_categories[0].count;
              const width = Math.round((c.count / maxCount) * 100);
              return (
                <div key={c.category} className="bar-row">
                  <span className="bar-label">
                    {CATEGORY_LABELS[c.category] || c.category}
                  </span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${width}%` }} />
                  </div>
                  <span className="bar-value">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Brands */}
      {stats.top_brands.length > 0 && (
        <div className="stats-section">
          <h4 className="section-label">자주 입은 브랜드</h4>
          <div className="tag-list">
            {stats.top_brands.map((b) => (
              <span key={b.brand} className="brand-tag">
                {b.brand} <em>×{b.count}</em>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Temperature Ranges */}
      {stats.temperature_ranges.length > 0 && (
        <div className="stats-section">
          <h4 className="section-label">기온별 착용 패턴</h4>
          <div className="temp-grid">
            {stats.temperature_ranges.map((t) => (
              <div key={t.range} className="temp-card">
                <span className="temp-range">{t.range}</span>
                <span className="temp-count">{t.count}회</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

