import React, { useState, useEffect, useCallback } from 'react';
import { fetchCalendar } from '../api/fitArchiveApi';
import type { CalendarMonthData, CalendarDayEntry } from '../types';
import { TPO_COLORS } from '../types';
import './MonthlyCalendarGrid.css';

interface Props {
  onDayClick: (entry: CalendarDayEntry | null, date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const MonthlyCalendarGrid: React.FC<Props> = ({ onDayClick, onMonthChange }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarMonthData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchCalendar(year, month);
      setData(result);
    } catch (err) {
      console.error('캘린더 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
    onMonthChange?.(year, month);
  }, [load, onMonthChange, year, month]);

  const navigateMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  };

  // 캘린더 그리드 생성
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const entryMap = new Map<string, CalendarDayEntry>();
  data?.entries.forEach((e) => {
    entryMap.set(e.fit_date, e);
  });

  const cells: (CalendarDayEntry | null | 'empty')[] = [];
  // 시작 요일 전 빈 셀
  for (let i = 0; i < firstDay; i++) cells.push('empty');
  // 날짜 셀
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entry = entryMap.get(dateStr) || null;
    cells.push(entry);
  }

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <button className="nav-btn" onClick={() => navigateMonth(-1)}>◀</button>
        <h2 className="calendar-title">
          {year}년 {month}월
        </h2>
        <button className="nav-btn" onClick={() => navigateMonth(1)}>▶</button>
      </div>

      {/* Weekday labels */}
      <div className="weekday-row">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`weekday-cell ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="calendar-loading">로딩 중...</div>
      ) : (
        <div className="calendar-grid">
          {cells.map((cell, idx) => {
            if (cell === 'empty') {
              return <div key={`empty-${idx}`} className="day-cell empty" />;
            }

            const dayNum = idx - firstDay + 1;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const entry = cell as CalendarDayEntry | null;

            return (
              <div
                key={dateStr}
                className={`day-cell ${entry ? 'has-fit' : 'no-fit'}`}
                onClick={() => onDayClick(entry, dateStr)}
              >
                {/* 썸네일 배경 마스킹 */}
                {entry ? (
                  <div
                    className="thumbnail-bg"
                    style={{ backgroundImage: `url(${entry.thumbnail_url})` }}
                  >
                    <span className="day-number overlay">{dayNum}</span>
                    {entry.tpo_category && (
                      <span
                        className="tpo-badge"
                        style={{ backgroundColor: TPO_COLORS[entry.tpo_category] || '#888' }}
                      >
                        {entry.tpo_category}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="empty-day">
                    <span className="day-number">{dayNum}</span>
                    <span className="hanger-icon">👔+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

