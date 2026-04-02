import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

@Entity('jobs')
@Index('idx_jobs_city', ['city'])
@Index('idx_jobs_salary', ['salaryMin', 'salaryMax'])
@Index('idx_jobs_source', ['source', 'sourceId'], { unique: true })
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 200 })
  title!: string

  @Column({ type: 'varchar', length: 200 })
  company!: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  city?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  district?: string

  @Column({ type: 'int', nullable: true, name: 'salary_min' })
  salaryMin?: number

  @Column({ type: 'int', nullable: true, name: 'salary_max' })
  salaryMax?: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  experience?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  education?: string

  @Column({ type: 'text', nullable: true })
  description?: string

  /** 技能标签数组，使用 GIN 索引加速查询 */
  @Column({ type: 'text', array: true, default: '{}' })
  @Index('idx_jobs_skills', { synchronize: false }) // GIN 索引需手动创建
  skills!: string[]

  @Column({ type: 'varchar', length: 50, default: 'boss' })
  source!: string

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'source_id' })
  sourceId?: string

  @Column({ type: 'jsonb', nullable: true, name: 'raw_data' })
  rawData?: Record<string, unknown>

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date
}
