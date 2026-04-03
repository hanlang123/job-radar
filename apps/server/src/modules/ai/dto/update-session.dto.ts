import { IsString, IsOptional, MaxLength } from 'class-validator'

/** 更新会话 DTO */
export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string
}
