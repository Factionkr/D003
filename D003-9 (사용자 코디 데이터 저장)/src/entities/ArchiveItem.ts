import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { DailyFitArchive } from './DailyFitArchive';

@Entity('archive_items')
export class ArchiveItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'archive_id' })
  archiveId!: string;

  @ManyToOne(() => DailyFitArchive, (archive) => archive.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'archive_id' })
  archive!: DailyFitArchive;

  @Column({ type: 'varchar', length: 50 })
  category!: string; // TOP, BOTTOM, OUTER, SHOES, ACC

  @Column({ type: 'varchar', length: 20, name: 'item_source' })
  itemSource!: string; // USER_CLOSET, ECOMMERCE_PRODUCT

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'product_id' })
  productId?: string;

  @Column({ type: 'varchar', length: 150, name: 'item_name' })
  itemName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  size?: string;

  @Column({ type: 'jsonb', nullable: true })
  boundingBox?: Record<string, number>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}

