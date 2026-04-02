import { IsOptional, IsString, IsInt, IsArray, Min, Max } from 'class-validator'
import { Type, Transform } from 'class-transformer'

/** 职位列表查询 DTO */
export class QueryJobDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',')
    return value
  })
  @IsArray()
  @IsString({ each: true })
  skills?: string[]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  salaryMax?: number

  @IsOptional()
  @IsString()
  experience?: string

  @IsOptional()
  @IsString()
  education?: string

  @IsOptional()
  @IsString()
  keyword?: string
}
