import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { DailyFitArchive } from './DailyFitArchive';

@Entity('fit_user_feedback')
export class FitUserFeedback {
  @PrimaryGeneratedColumn('uuid', { name: 'feedback_id' })
  feedbackId!: string;

  @Column({ type: 'uuid', name: 'archive_id' })
  archiveId!: string;

  @OneToOne(() => DailyFitArchive, (archive) => archive.feedback, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'archive_id' })
  archive!: DailyFitArchive;

  @Column({ type: 'int', nullable: true, name: 'satisfaction_score' })
  satisfactionScore?: number; // 1~5

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'fit_rating' })
  fitRating?: string;

  @Column({ type: 'text', nullable: true })
  memo?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}

