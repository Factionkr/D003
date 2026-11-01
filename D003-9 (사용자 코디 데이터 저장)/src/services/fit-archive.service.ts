import { DataSource, Repository, Between, MoreThanOrEqual, LessThan } from 'typeorm';
import { DailyFitArchive, ArchiveItem, FitEnvironmentContext, FitUserFeedback } from '../entities';
import { CreateFitArchiveDto, UpdateFitArchiveDto } from '../dto/fit-archive.dto';
import {
  FitArchiveDetailResponse,
  CalendarMonthResponse,
  CalendarDayEntry,
  ArchiveItemResponse,
  EnvironmentContextResponse,
  FeedbackResponse,
  MonthlyStatsResponse,
} from '../dto/fit-archive-response.dto';
import { ImageProcessingService } from './image-processing.service';

export class FitArchiveService {
  private archiveRepo: Repository<DailyFitArchive>;
  private itemRepo: Repository<ArchiveItem>;
  private contextRepo: Repository<FitEnvironmentContext>;
  private feedbackRepo: Repository<FitUserFeedback>;

  constructor(
    private dataSource: DataSource,
    private imageService: ImageProcessingService
  ) {
    this.archiveRepo = dataSource.getRepository(DailyFitArchive);
    this.itemRepo = dataSource.getRepository(ArchiveItem);
    this.contextRepo = dataSource.getRepository(FitEnvironmentContext);
    this.feedbackRepo = dataSource.getRepository(FitUserFeedback);
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/fit-archives — 착장 최종 확정 등록
  // ──────────────────────────────────────────────────────────
  async createArchive(userId: string, dto: CreateFitArchiveDto): Promise<FitArchiveDetailResponse> {
    // 유니크 제약 조건 사전 체크 (user_id + fit_date)
    const existing = await this.archiveRepo.findOne({
      where: { userId, fitDate: dto.fit_date },
    });
    if (existing) {
      const error: any = new Error(`이미 해당 날짜(${dto.fit_date})에 등록된 아카이브가 있습니다.`);
      error.statusCode = 409;
      throw error;
    }

    // 이미지 처리: 원본 → 고해상도(1080x1440) + 썸네일(300x400)
    const { snapshotUrl, thumbnailUrl } = await this.imageService.processAndUpload(
      dto.snapshot_base64_or_signed_url
    );

    // 트랜잭션으로 일괄 저장
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1) 메인 아카이브 저장
      const archive = queryRunner.manager.create(DailyFitArchive, {
        userId,
        fitDate: dto.fit_date,
        title: dto.title,
        fittingSnapshotUrl: snapshotUrl,
        thumbnailUrl,
        isWornInReality: true,
        privacyLevel: 'PRIVATE',
      });
      const savedArchive = await queryRunner.manager.save(DailyFitArchive, archive);

      // 2) 아이템 매핑 저장
      const items = dto.items.map((item) =>
        queryRunner.manager.create(ArchiveItem, {
          archiveId: savedArchive.archiveId,
          category: item.category,
          itemSource: item.item_source,
          productId: item.product_id,
          itemName: item.item_name,
          brand: item.brand,
          color: item.color,
          size: item.size,
          boundingBox: item.bounding_box as any,
        })
      );
      const savedItems = await queryRunner.manager.save(ArchiveItem, items);

      // 3) 환경 컨텍스트 저장
      let savedContext: FitEnvironmentContext | undefined;
      if (dto.context) {
        const context = queryRunner.manager.create(FitEnvironmentContext, {
          archiveId: savedArchive.archiveId,
          temperatureMin: dto.context.temperature_min,
          temperatureMax: dto.context.temperature_max,
          weatherCondition: dto.context.weather_condition,
          tpoCategory: dto.context.tpo_category,
          locationCity: dto.context.location_city,
        });
        savedContext = await queryRunner.manager.save(FitEnvironmentContext, context);
      }

      await queryRunner.commitTransaction();

      return this.toDetailResponse(savedArchive, savedItems, savedContext, undefined);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/fit-archives/calendar?year=YYYY&month=MM
  // ──────────────────────────────────────────────────────────
  async getCalendar(userId: string, year: number, month: number): Promise<CalendarMonthResponse> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const archives = await this.archiveRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.environmentContext', 'ctx')
      .where('a.userId = :userId', { userId })
      .andWhere('a.fitDate >= :start', { start: startDate.toISOString().slice(0, 10) })
      .andWhere('a.fitDate < :end', { end: endDate.toISOString().slice(0, 10) })
      .orderBy('a.fitDate', 'ASC')
      .getMany();

    const entries: CalendarDayEntry[] = archives.map((a) => ({
      fit_date: a.fitDate,
      archive_id: a.archiveId,
      thumbnail_url: a.thumbnailUrl,
      tpo_category: a.environmentContext?.tpoCategory,
      title: a.title,
    }));

    return { year, month, entries };
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/fit-archives/:archive_id
  // ──────────────────────────────────────────────────────────
  async getArchiveDetail(userId: string, archiveId: string): Promise<FitArchiveDetailResponse> {
    const archive = await this.archiveRepo.findOne({
      where: { archiveId, userId },
      relations: ['items', 'environmentContext', 'feedback'],
    });

    if (!archive) {
      const error: any = new Error('아카이브를 찾을 수 없습니다.');
      error.statusCode = 404;
      throw error;
    }

    return this.toDetailResponse(archive, archive.items, archive.environmentContext, archive.feedback);
  }

  // ──────────────────────────────────────────────────────────
  // PATCH /api/v1/fit-archives/:archive_id
  // ──────────────────────────────────────────────────────────
  async updateArchive(
    userId: string,
    archiveId: string,
    dto: UpdateFitArchiveDto
  ): Promise<FitArchiveDetailResponse> {
    const archive = await this.archiveRepo.findOne({
      where: { archiveId, userId },
      relations: ['items', 'environmentContext', 'feedback'],
    });

    if (!archive) {
      const error: any = new Error('아카이브를 찾을 수 없습니다.');
      error.statusCode = 404;
      throw error;
    }

    // 아카이브 기본 필드 업데이트
    if (dto.is_worn_in_reality !== undefined) archive.isWornInReality = dto.is_worn_in_reality;
    if (dto.title !== undefined) archive.title = dto.title;
    if (dto.privacy_level !== undefined) archive.privacyLevel = dto.privacy_level;

    await this.archiveRepo.save(archive);

    // 피드백 업데이트 (upsert)
    const hasFeedbackUpdate =
      dto.satisfaction_score !== undefined || dto.fit_rating !== undefined || dto.memo !== undefined;

    if (hasFeedbackUpdate) {
      let feedback = archive.feedback;
      if (!feedback) {
        feedback = this.feedbackRepo.create({ archiveId });
      }
      if (dto.satisfaction_score !== undefined) feedback.satisfactionScore = dto.satisfaction_score;
      if (dto.fit_rating !== undefined) feedback.fitRating = dto.fit_rating;
      if (dto.memo !== undefined) feedback.memo = dto.memo;
      await this.feedbackRepo.save(feedback);
      archive.feedback = feedback;
    }

    return this.toDetailResponse(
      archive,
      archive.items,
      archive.environmentContext,
      archive.feedback
    );
  }

  // ──────────────────────────────────────────────────────────
  // DELETE /api/v1/fit-archives/:archive_id
  // ──────────────────────────────────────────────────────────
  async deleteArchive(userId: string, archiveId: string): Promise<void> {
    const archive = await this.archiveRepo.findOne({
      where: { archiveId, userId },
    });

    if (!archive) {
      const error: any = new Error('아카이브를 찾을 수 없습니다.');
      error.statusCode = 404;
      throw error;
    }

    // CASCADE 삭제: items, context, feedback 모두 자동 삭제
    await this.archiveRepo.remove(archive);

    // CDN 이미지 정리 (비동기 — 실패해도 무시)
    this.imageService.deleteImages(archive.fittingSnapshotUrl, archive.thumbnailUrl).catch(() => {});
  }

  // ──────────────────────────────────────────────────────────
  // Monthly Stats — 월간 착용 통계
  // ──────────────────────────────────────────────────────────
  async getMonthlyStats(userId: string, year: number, month: number): Promise<MonthlyStatsResponse> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    // 해당 월의 전체 아카이브 조회
    const archives = await this.archiveRepo.find({
      where: {
        userId,
        fitDate: Between(startDate, endDate) as any,
      },
      relations: ['items', 'environmentContext', 'feedback'],
    });

    const totalFits = archives.length;
    const wornCount = archives.filter((a) => a.isWornInReality).length;

    // 카테고리별 빈도
    const categoryCounts = new Map<string, number>();
    const brandCounts = new Map<string, number>();

    archives.forEach((a) => {
      a.items?.forEach((item) => {
        categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
        if (item.brand) {
          brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1);
        }
      });
    });

    const topCategories = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topBrands = Array.from(brandCounts.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 기온 범위별 분류
    const tempRanges = new Map<string, number>();
    archives.forEach((a) => {
      if (a.environmentContext?.temperatureMax !== undefined) {
        const max = Number(a.environmentContext.temperatureMax);
        let range: string;
        if (max < 0) range = '영하';
        else if (max < 10) range = '0~9°C';
        else if (max < 20) range = '10~19°C';
        else if (max < 30) range = '20~29°C';
        else range = '30°C+';
        tempRanges.set(range, (tempRanges.get(range) || 0) + 1);
      }
    });

    // 평균 만족도
    const scores = archives
      .filter((a) => a.feedback?.satisfactionScore)
      .map((a) => a.feedback!.satisfactionScore!);
    const avgSatisfaction =
      scores.length > 0 ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : null;

    return {
      total_fits: totalFits,
      worn_count: wornCount,
      top_categories: topCategories,
      top_brands: topBrands,
      temperature_ranges: Array.from(tempRanges.entries()).map(([range, count]) => ({ range, count })),
      avg_satisfaction: avgSatisfaction,
    };
  }

  // ──────── Entity → Response Mapper ────────
  private toDetailResponse(
    archive: DailyFitArchive,
    items: ArchiveItem[],
    context?: FitEnvironmentContext,
    feedback?: FitUserFeedback
  ): FitArchiveDetailResponse {
    const itemResponses: ArchiveItemResponse[] = (items || []).map((i) => ({
      id: i.id,
      category: i.category,
      item_source: i.itemSource,
      product_id: i.productId,
      item_name: i.itemName,
      brand: i.brand,
      color: i.color,
      size: i.size,
      bounding_box: i.boundingBox as any,
    }));

    const contextResponse: EnvironmentContextResponse | undefined = context
      ? {
          temperature_min: context.temperatureMin ? Number(context.temperatureMin) : undefined,
          temperature_max: context.temperatureMax ? Number(context.temperatureMax) : undefined,
          weather_condition: context.weatherCondition,
          tpo_category: context.tpoCategory,
          location_city: context.locationCity,
        }
      : undefined;

    const feedbackResponse: FeedbackResponse | undefined = feedback
      ? {
          satisfaction_score: feedback.satisfactionScore,
          fit_rating: feedback.fitRating,
          memo: feedback.memo,
          created_at: feedback.createdAt?.toISOString(),
        }
      : undefined;

    return {
      archive_id: archive.archiveId,
      user_id: archive.userId,
      fit_date: archive.fitDate,
      title: archive.title,
      fitting_snapshot_url: archive.fittingSnapshotUrl,
      thumbnail_url: archive.thumbnailUrl,
      is_worn_in_reality: archive.isWornInReality,
      privacy_level: archive.privacyLevel,
      created_at: archive.createdAt?.toISOString(),
      updated_at: archive.updatedAt?.toISOString(),
      items: itemResponses,
      context: contextResponse,
      feedback: feedbackResponse,
    };
  }
}

