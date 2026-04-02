import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator'

export class RegisterDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  @MaxLength(50, { message: '密码最多 50 位' })
  password!: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string
}

export class LoginDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password!: string
}

export class RefreshTokenDto {
  @IsString({ message: 'refreshToken 不能为空' })
  refreshToken!: string
}
