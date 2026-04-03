import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  Logger,
  Get,
  Param,
  Query,
  Delete,
  Patch,
  NotFoundException,
} from '@nestjs/common'
import { Response } from 'express'
import { AiService } from './ai.service'
import { ChatDto } from './dto/chat.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatSessionEntity } from './entities/chat-session.entity'
import { UpdateSessionDto } from './dto/update-session.dto'

@Controller('chat')
export class AiController {
  private readonly logger = new Logger(AiController.name)

  constructor(
    private readonly aiService: AiService,
    @InjectRepository(ChatSessionEntity)
    private readonly sessionRepo: Repository<ChatSessionEntity>,
  ) {}

  /**
   * SSE 流式聊天端点（Dify 简化版格式）
   * POST /api/chat/stream
   */
  @Post('stream')
  @UseGuards(JwtAuthGuard)
  async streamChat(
    @Body() dto: ChatDto,
    @CurrentUser() user: { id: string; email: string },
    @Res() res: Response,
  ) {
    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    try {
      const { sessionId, stream } = await this.aiService.createChatStream(dto, user)
      const createdAt = Math.floor(Date.now() / 1000)

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({
          event: 'message',
          answer: chunk,
          conversation_id: sessionId,
          created_at: createdAt,
        })}\n\n`)
      }

      res.write(`data: ${JSON.stringify({
        event: 'message_end',
        conversation_id: sessionId,
      })}\n\n`)
    } catch (error) {
      this.logger.error('SSE 流式传输出错:', error)
      const message = error instanceof Error ? error.message : '服务器内部错误'
      res.write(`data: ${JSON.stringify({
        event: 'error',
        code: 'internal_error',
        message,
        status: 500,
      })}\n\n`)
    } finally {
      res.end()
    }
  }

  /**
   * 获取用户的聊天会话列表
   * GET /api/chat/sessions
   */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(
    @CurrentUser() user: { id: string },
    @Query('scene') scene?: string,
  ) {
    const where: Record<string, unknown> = { userId: user.id }
    if (scene) where.scene = scene
    return this.sessionRepo.find({
      where,
      order: { updatedAt: 'DESC' },
      select: ['id', 'title', 'scene', 'jobId', 'createdAt', 'updatedAt'],
      take: 50,
    })
  }

  /**
   * 查找用户会话，不存在时抛出 404
   */
  private async findSessionOrFail(id: string, userId: string): Promise<ChatSessionEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id, userId },
    })
    if (!session) {
      throw new NotFoundException('会话不存在')
    }
    return session
  }

  /**
   * 获取单个会话详情
   * GET /api/chat/sessions/:id
   */
  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async getSession(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.findSessionOrFail(id, user.id)
  }

  /**
   * 更新会话标题
   * PATCH /api/chat/sessions/:id
   */
  @Patch('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: { id: string },
  ) {
    const session = await this.findSessionOrFail(id, user.id)
    if (dto.title !== undefined) {
      session.title = dto.title
    }
    return this.sessionRepo.save(session)
  }

  /**
   * 删除会话
   * DELETE /api/chat/sessions/:id
   */
  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSession(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    const session = await this.findSessionOrFail(id, user.id)
    await this.sessionRepo.remove(session)
    return { success: true }
  }
}
