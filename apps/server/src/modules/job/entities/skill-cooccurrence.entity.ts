import { Entity, PrimaryColumn, Column } from 'typeorm'

/** 技能共现矩阵实体 */
@Entity('skill_cooccurrence')
export class SkillCooccurrenceEntity {
  @PrimaryColumn({ type: 'varchar', length: 50, name: 'skill_a' })
  skillA!: string

  @PrimaryColumn({ type: 'varchar', length: 50, name: 'skill_b' })
  skillB!: string

  @Column({ type: 'int', default: 1 })
  count!: number

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true, name: 'avg_salary' })
  avgSalary?: number
}
