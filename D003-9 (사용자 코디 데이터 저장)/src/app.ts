import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { DailyFitArchive, ArchiveItem, FitEnvironmentContext, FitUserFeedback } from './entities';
import { FitArchiveService } from './services/fit-archive.service';
import { ImageProcessingService } from './services/image-processing.service';
import { FitArchiveController } from './controllers/fit-archive.controller';

// ──────── TypeORM DataSource ────────
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'fit_archive_db',
  synchronize: process.env.NODE_ENV !== 'production', // 개발 환경만
  logging: process.env.NODE_ENV !== 'production',
  entities: [DailyFitArchive, ArchiveItem, FitEnvironmentContext, FitUserFeedback],
});

// ──────── Bootstrap ────────
async function bootstrap() {
  await AppDataSource.initialize();
  console.log('📦 Database connected');

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Fit Archive module
  const imageService = new ImageProcessingService();
  const fitArchiveService = new FitArchiveService(AppDataSource, imageService);
  const fitArchiveController = new FitArchiveController(fitArchiveService);

  app.use('/api/v1/fit-archives', fitArchiveController.router);

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('❌ Unhandled error:', err);
    res.status(err.statusCode || 500).json({
      error: 'INTERNAL_ERROR',
      message: err.message || '서버 내부 오류가 발생했습니다.',
    });
  });

  const port = parseInt(process.env.PORT || '4000', 10);
  app.listen(port, () => {
    console.log(`🚀 Fit Archive API running on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

