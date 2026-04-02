import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * 从请求中提取当前登录用户信息
 * @example @CurrentUser() user: UserPayload
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user
    return data ? user?.[data] : user
  },
)
