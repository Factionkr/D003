import React, { useState, useCallback } from 'react';
import { MonthlyCalendarGrid } from './components/MonthlyCalendarGrid';
import { BottomSheetDrawer } from './components/BottomSheetDrawer';
import { MonthlyStatsReport } from './components/MonthlyStatsReport';
import type { CalendarDayEntry } from './types';
import './App.css';

const App: React.FC = () => {
  const [selectedEntry, setSelectedEntry] = useState<CalendarDayEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const handleDayClick = useCallback((entry: CalendarDayEntry | null, date: string) => {
    setSelectedEntry(entry);
    setSelectedDate(date);
    setSheetOpen(true);
  }, []);

  const handleMonthChange = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>👗 Daily Fit Archive</h1>
        <p className="app-subtitle">나만의 데일리 룩북</p>
      </header>

      <main>
        {/* 월간 캘린더 그리드 */}
        <MonthlyCalendarGrid
          onDayClick={handleDayClick}
          onMonthChange={handleMonthChange}
        />

        {/* 월간 착용 통계 리포트 */}
        <MonthlyStatsReport year={currentYear} month={currentMonth} />
      </main>

      {/* 바텀시트 상세 드로어 */}
      <BottomSheetDrawer
        archiveId={selectedEntry?.archive_id || null}
        fitDate={selectedDate}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
};

export default App;

