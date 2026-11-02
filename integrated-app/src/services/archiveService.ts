import { DailyFitArchive, MonthlyStatsReport, WardrobeItem, OutfitRecommendation } from '../types';
import { INITIAL_ARCHIVES } from '../mockData/initialData';

export class ArchiveService {
  private static STORAGE_KEY = 'styleai_fit_archives';

  public static getArchives(): DailyFitArchive[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      // SSR or Storage unavailable
    }
    return INITIAL_ARCHIVES;
  }

  public static saveArchive(archive: DailyFitArchive): void {
    const list = this.getArchives();
    const existingIdx = list.findIndex((a) => a.date === archive.date);
    if (existingIdx >= 0) {
      list[existingIdx] = archive;
    } else {
      list.unshift(archive);
    }
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  public static generateMonthlyReport(year: number, month: number, wardrobe: WardrobeItem[]): MonthlyStatsReport {
    const archives = this.getArchives();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthlyList = archives.filter((a) => a.date.startsWith(monthPrefix));

    if (monthlyList.length === 0) {
      return {
        totalLoggedDays: 0,
        averageRating: 0,
        topStyle: '미니멀 / 캐주얼',
        mostWornItems: wardrobe.slice(0, 3).map((item) => ({ item, count: item.wearCount || 1 })),
        categoryBreakdown: [
          { category: '상의', count: 12, percentage: 40 },
          { category: '하의', count: 10, percentage: 33 },
          { category: '아우터', count: 5, percentage: 17 },
          { category: '신발', count: 3, percentage: 10 },
        ],
      };
    }

    const totalLoggedDays = monthlyList.length;
    const avgRating =
      monthlyList.reduce((acc, curr) => acc + (curr.rating || 5), 0) / (totalLoggedDays || 1);

    // 가장 많이 입은 아이템 집계
    const wearMap = new Map<string, number>();
    monthlyList.forEach((arch) => {
      const outfit = arch.outfit;
      if (outfit.topItem) wearMap.set(outfit.topItem.id, (wearMap.get(outfit.topItem.id) || 0) + 1);
      if (outfit.bottomItem) wearMap.set(outfit.bottomItem.id, (wearMap.get(outfit.bottomItem.id) || 0) + 1);
      if (outfit.outerItem) wearMap.set(outfit.outerItem.id, (wearMap.get(outfit.outerItem.id) || 0) + 1);
      if (outfit.shoesItem) wearMap.set(outfit.shoesItem.id, (wearMap.get(outfit.shoesItem.id) || 0) + 1);
    });

    const mostWornItems: { item: WardrobeItem; count: number }[] = [];
    wearMap.forEach((count, id) => {
      const found = wardrobe.find((w) => w.id === id);
      if (found) mostWornItems.push({ item: found, count });
    });
    mostWornItems.sort((a, b) => b.count - a.count);

    return {
      totalLoggedDays,
      averageRating: parseFloat(avgRating.toFixed(1)),
      topStyle: '미니멀 & 비즈니스 캐주얼',
      mostWornItems: mostWornItems.slice(0, 4),
      categoryBreakdown: [
        { category: '상의 (Top)', count: 15, percentage: 38 },
        { category: '하의 (Bottom)', count: 13, percentage: 32 },
        { category: '아우터 (Outer)', count: 7, percentage: 18 },
        { category: '슈즈 (Shoes)', count: 5, percentage: 12 },
      ],
    };
  }
}

