import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import Redis from 'ioredis'
import { UserService } from '../user/user.service'
import { UserEntity } from '../user/entities/user.entity'
import { RegisterDto, LoginDto } from './dto'

/** JWT payload 结构 */
export interface JwtPayload {
  sub: string
  email: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly redis: Redis

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    })
  }

  /** 注册 */
  async register(dto: RegisterDto) {
    const existing = await this.userService.findByEmail(dto.email)
    if (existing) {
      throw new ConflictException('该邮箱已被注册')
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(dto.password, salt)

    const user = await this.userService.create({
      email: dto.email,
      passwordHash,
      nickname: dto.nickname || dto.email.split('@')[0],
      skills: [],
    })

    return this.generateTokens(user)
  }

  /** 登录 */
  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email)
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    return this.generateTokens(user)
  }

  /** 刷新令牌 */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      })

      // 检查 Redis 中是否存在该 refresh token
      const storedToken = await this.redis.get(`refresh:${payload.sub}`)
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token 已失效')
      }

      const user = await this.userService.findById(payload.sub)
      if (!user) {
        throw new UnauthorizedException('用户不存在')
      }

      return this.generateTokens(user)
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('Refresh token 无效或已过期')
    }
  }

  /** 登出，清除 Redis 中的 refresh token */
  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`)
    return { message: '登出成功' }
  }

  /** 生成 access token + refresh token 对 */
  private async generateTokens(user: UserEntity) {
    const payload: JwtPayload = { sub: user.id, email: user.email }

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    })

    // 存储 refresh token 到 Redis，7 天过期
    await this.redis.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60)

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        skills: user.skills,
        targetCity: user.targetCity,
        targetSalary: user.targetSalary,
        role: user.role || 'user',
        createdAt: user.createdAt.toISOString(),
      },
    }
  }
}
