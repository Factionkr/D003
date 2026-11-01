import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { ArchiveItem } from './ArchiveItem';
import { FitEnvironmentContext } from './FitEnvironmentContext';
import { FitUserFeedback } from './FitUserFeedback';

@Entity('daily_fit_archives')
@Unique(['userId', 'fitDate'])
export class DailyFitArchive {
  @PrimaryGeneratedColumn('uuid')
  archiveId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'date', name: 'fit_date' })
  fitDate!: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 100, nullable: true })
  title?: string;

  @Column({ type: 'varchar', length: 500, name: 'fitting_snapshot_url' })
  fittingSnapshotUrl!: string;

  @Column({ type: 'varchar', length: 500, name: 'thumbnail_url' })
  thumbnailUrl!: string;

  @Column({ type: 'boolean', name: 'is_worn_in_reality', default: true })
  isWornInReality!: boolean;

  @Column({ type: 'varchar', length: 20, name: 'privacy_level', default: 'PRIVATE' })
  privacyLevel!: string; // PRIVATE, FRIENDS, PUBLIC

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => ArchiveItem, (item) => item.archive, { cascade: true })
  items!: ArchiveItem[];

  @OneToOne(() => FitEnvironmentContext, (ctx) => ctx.archive, { cascade: true })
  @JoinColumn({ name: 'archive_id' })
  environmentContext!: FitEnvironmentContext;

  @OneToOne(() => FitUserFeedback, (fb) => fb.archive, { cascade: true })
  @JoinColumn({ name: 'archive_id' })
  feedback?: FitUserFeedback;
}

