import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { UserEntity } from '../../user/entities/user.entity'
import { JobEntity } from '../../job/entities/job.entity'

/** 聊天会话实体 */
@Entity('chat_sessions')
export class ChatSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity

  @Column({ type: 'varchar', length: 100, nullable: true })
  title?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  scene?: string

  @Column({ type: 'uuid', nullable: true, name: 'job_id' })
  jobId?: string

  @ManyToOne(() => JobEntity, { nullable: true })
  @JoinColumn({ name: 'job_id' })
  job?: JobEntity

  @Column({ type: 'jsonb', default: '[]' })
  messages!: Record<string, unknown>[]

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date
}
