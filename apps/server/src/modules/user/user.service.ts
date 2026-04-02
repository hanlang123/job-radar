import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /** 根据邮箱查找用户 */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { email } })
  }

  /** 根据 ID 查找用户 */
  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } })
  }

  /** 创建新用户 */
  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.userRepo.create(data)
    return this.userRepo.save(user)
  }

  /** 更新用户信息 */
  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null> {
    await this.userRepo.update(id, data)
    return this.findById(id)
  }
}
