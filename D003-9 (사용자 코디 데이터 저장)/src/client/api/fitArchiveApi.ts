import type { CalendarMonthData, FitArchiveDetail, MonthlyStats } from '../types';

const API_BASE = '/api/v1/fit-archives';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error: any = new Error(body.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

/** 착장 최종 확정 등록 */
export async function createFitArchive(payload: Record<string, any>): Promise<FitArchiveDetail> {
  return request<FitArchiveDetail>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** 월간 캘린더 데이터 조회 */
export async function fetchCalendar(year: number, month: number): Promise<CalendarMonthData> {
  return request<CalendarMonthData>(`${API_BASE}/calendar?year=${year}&month=${month}`);
}

/** 아카이브 상세 조회 */
export async function fetchArchiveDetail(archiveId: string): Promise<FitArchiveDetail> {
  return request<FitArchiveDetail>(`${API_BASE}/${archiveId}`);
}

/** 아카이브 업데이트 (PATCH) */
export async function updateArchive(
  archiveId: string,
  payload: Record<string, any>
): Promise<FitArchiveDetail> {
  return request<FitArchiveDetail>(`${API_BASE}/${archiveId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** 아카이브 삭제 */
export async function deleteArchive(archiveId: string): Promise<void> {
  return request<void>(`${API_BASE}/${archiveId}`, { method: 'DELETE' });
}

/** 월간 착용 통계 */
export async function fetchMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
  return request<MonthlyStats>(`${API_BASE}/stats?year=${year}&month=${month}`);
}

