import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../../modules/user/entities/user.entity'

/**
 * 管理员守卫
 * 需要配合 JwtAuthGuard 一起使用，先验证 JWT 再检查角色
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const userId = request.user?.id

    if (!userId) {
      throw new ForbiddenException('需要登录')
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    })

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('需要管理员权限')
    }

    return true
  }
}
