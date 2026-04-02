import { ValidationPipe as NestValidationPipe } from '@nestjs/common'

/** 全局参数校验管道 */
export const GlobalValidationPipe = new NestValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
