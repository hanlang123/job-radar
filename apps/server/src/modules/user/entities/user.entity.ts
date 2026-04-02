import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 200, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 200, name: 'password_hash' })
  passwordHash!: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname?: string

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role!: string

  @Column({ type: 'text', array: true, default: '{}' })
  skills!: string[]

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'target_city' })
  targetCity?: string

  @Column({ type: 'int', nullable: true, name: 'target_salary' })
  targetSalary?: number

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}
