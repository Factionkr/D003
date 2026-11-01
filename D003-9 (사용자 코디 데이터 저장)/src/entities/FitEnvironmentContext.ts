import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { DailyFitArchive } from './DailyFitArchive';

@Entity('fit_environment_contexts')
export class FitEnvironmentContext {
  @PrimaryGeneratedColumn('uuid', { name: 'context_id' })
  contextId!: string;

  @Column({ type: 'uuid', name: 'archive_id' })
  archiveId!: string;

  @OneToOne(() => DailyFitArchive, (archive) => archive.environmentContext, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'archive_id' })
  archive!: DailyFitArchive;

  @Column({ type: 'numeric', precision: 4, scale: 1, nullable: true, name: 'temperature_min' })
  temperatureMin?: number;

  @Column({ type: 'numeric', precision: 4, scale: 1, nullable: true, name: 'temperature_max' })
  temperatureMax?: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'weather_condition' })
  weatherCondition?: string; // SUNNY, RAINY, SNOWY, CLOUDY, CLEAR

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'tpo_category' })
  tpoCategory?: string; // BUSINESS, CASUAL, DATE, FORMAL, WORKOUT

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'location_city' })
  locationCity?: string;
}

