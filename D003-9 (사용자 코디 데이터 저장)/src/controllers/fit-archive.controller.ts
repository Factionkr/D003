import { Router, Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FitArchiveService } from '../services/fit-archive.service';
import { CreateFitArchiveDto, UpdateFitArchiveDto } from '../dto/fit-archive.dto';

export class FitArchiveController {
  public router: Router;

  constructor(private service: FitArchiveService) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post('/', this.createArchive.bind(this));
    this.router.get('/calendar', this.getCalendar.bind(this));
    this.router.get('/stats', this.getMonthlyStats.bind(this));
    this.router.get('/:archive_id', this.getArchiveDetail.bind(this));
    this.router.patch('/:archive_id', this.updateArchive.bind(this));
    this.router.delete('/:archive_id', this.deleteArchive.bind(this));
  }

  // ──────── POST /api/v1/fit-archives ────────
  private async createArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.extractUserId(req);
      const dto = plainToInstance(CreateFitArchiveDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: '요청 데이터가 유효하지 않습니다.',
          details: errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
        });
      }

      const result = await this.service.createArchive(userId, dto);
      return res.status(201).json(result);
    } catch (err: any) {
      if (err.statusCode === 409) {
        return res.status(409).json({
          error: 'CONFLICT',
          message: err.message,
        });
      }
      next(err);
    }
  }

  // ──────── GET /api/v1/fit-archives/calendar ────────
  private async getCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.extractUserId(req);
      const year = parseInt(req.query.year as string, 10);
      const month = parseInt(req.query.month as string, 10);

      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({
          error: 'INVALID_PARAMS',
          message: 'year(YYYY)와 month(1~12) 파라미터가 필요합니다.',
        });
      }

      const result = await this.service.getCalendar(userId, year, month);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ──────── GET /api/v1/fit-archives/stats ────────
  private async getMonthlyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.extractUserId(req);
      const year = parseInt(req.query.year as string, 10);
      const month = parseInt(req.query.month as string, 10);

      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({
          error: 'INVALID_PARAMS',
          message: 'year(YYYY)와 month(1~12) 파라미터가 필요합니다.',
        });
      }

      const result = await this.service.getMonthlyStats(userId, year, month);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ──────── GET /api/v1/fit-archives/:archive_id ────────
  private async getArchiveDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.extractUserId(req);
      const { archive_id } = req.params;

      const result = await this.service.getArchiveDetail(userId, archive_id);
      return res.status(200).json(result);
    } catch (err: any) {
      if (err.statusCode === 404) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: err.message,
        });
      }
      next(err);
    }
  }

  // ──────── PATCH /api/v1/fit-archives/:archive_id ────────
  private async updateArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.extractUserId(req);
      const { archive_id } = req.params;
      const dto = plainToInstance(UpdateFitArchiveDto, req.body);
      const errors = await validate(dto, { skipMissingProperties: true });

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: '요청 데이터가 유효하지 않습니다.',
          details: errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
        });
      }

      const result = await this.service.updateArchive(userId, archive_id, dto);
      return res.status(200).json(result);
    } catch (err: any) {
      if (err.statusCode === 404) {
        return res.status(404).json({ error: 'NOT_FOUND', message: err.message });
      }
      next(err);
    }
  }

  // ──────── DELETE /api/v1/fit-archives/:archive_id ────────
  private async deleteArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.extractUserId(req);
      const { archive_id } = req.params;

      await this.service.deleteArchive(userId, archive_id);
      return res.status(204).send();
    } catch (err: any) {
      if (err.statusCode === 404) {
        return res.status(404).json({ error: 'NOT_FOUND', message: err.message });
      }
      next(err);
    }
  }

  /**
   * 인증 미들웨어에서 주입된 user_id 추출
   */
  private extractUserId(req: Request): string {
    const userId = (req as any).userId || req.headers['x-user-id'];
    if (!userId) {
      const error: any = new Error('인증되지 않은 요청입니다.');
      error.statusCode = 401;
      throw error;
    }
    return userId as string;
  }
}

