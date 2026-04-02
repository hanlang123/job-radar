import { Controller, Post, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { UserService } from '../user/user.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /** 注册 */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  /** 登录 */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  /** 刷新令牌 */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken)
  }

  /** 登出 */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId)
  }

  /** 更新个人信息 */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { skills?: string[]; nickname?: string; targetCity?: string; targetSalary?: number },
  ) {
    const updateData: Record<string, unknown> = {}
    if (body.skills !== undefined) updateData.skills = body.skills
    if (body.nickname !== undefined) updateData.nickname = body.nickname
    if (body.targetCity !== undefined) updateData.targetCity = body.targetCity
    if (body.targetSalary !== undefined) updateData.targetSalary = body.targetSalary
    return this.userService.update(userId, updateData)
  }
}
