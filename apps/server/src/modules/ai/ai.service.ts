import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import OpenAI from 'openai'
import { ChatDto } from './dto/chat.dto'
import { ChatSessionEntity } from './entities/chat-session.entity'
import { JobEntity } from '../job/entities/job.entity'
import { UserEntity } from '../user/entities/user.entity'
import { buildSystemPrompt } from './prompt/base.prompt'
import { JD_ANALYSIS_PROMPT } from './prompt/jd-analysis.prompt'
import { SKILL_MATCH_PROMPT } from './prompt/skill-match.prompt'
import { INTERVIEW_MOCK_PROMPT } from './prompt/interview-mock.prompt'
import type { ChatScene, ChatMessage } from '@job-radar/shared'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private readonly openai: OpenAI

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ChatSessionEntity)
    private readonly sessionRepo: Repository<ChatSessionEntity>,
    @InjectRepository(JobEntity)
    private readonly jobRepo: Repository<JobEntity>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY', ''),
      baseURL: this.configService.get('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    })
  }

  /**
   * 创建流式聊天，返回 sessionId 和 AsyncGenerator
   */
  async createChatStream(
    dto: ChatDto,
    user: { id: string; email: string },
  ): Promise<{ sessionId: string; stream: AsyncGenerator<string> }> {
    // 获取或创建会话
    let session: ChatSessionEntity | null = null
    if (dto.sessionId) {
      session = await this.sessionRepo.findOne({
        where: { id: dto.sessionId, userId: user.id },
      })
    }

    if (!session) {
      session = this.sessionRepo.create({
        userId: user.id,
        scene: dto.scene,
        jobId: dto.jobId,
        messages: [],
      })
      await this.sessionRepo.save(session)
    }

    // 构造上下文
    const contextData = await this.buildContext(dto, user)
    const systemPrompt = this.getScenePrompt(dto.scene, contextData)

    // 构建消息历史
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ]

    const history = (session.messages as unknown as ChatMessage[]) || []
    const recentHistory = history.slice(-20)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }

    messages.push({ role: 'user', content: dto.message })

    const sessionRef = session
    const sessionRepo = this.sessionRepo
    const configService = this.configService
    const openai = this.openai
    const logger = this.logger

    async function* generateStream(): AsyncGenerator<string> {
      try {
        const model = configService.get('OPENAI_MODEL', 'gpt-4o-mini')
        const stream = await openai.chat.completions.create({
          model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
        })

        let fullContent = ''

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            fullContent += content
            yield content
          }
        }

        // 更新会话消息历史
        const updatedMessages = [
          ...history,
          { role: 'user' as const, content: dto.message, timestamp: new Date().toISOString() },
          { role: 'assistant' as const, content: fullContent, timestamp: new Date().toISOString() },
        ]
        sessionRef.messages = updatedMessages as unknown as Record<string, unknown>[]
        await sessionRepo.save(sessionRef)
      } catch (error) {
        logger.error('AI 流式调用失败:', error)
        throw error
      }
    }

    return { sessionId: session.id, stream: generateStream() }
  }

  /**
   * 根据场景获取对应的 system prompt
   */
  private getScenePrompt(scene: ChatScene, contextData?: string): string {
    const scenePrompts: Record<ChatScene, string> = {
      'jd-analysis': JD_ANALYSIS_PROMPT,
      'skill-match': SKILL_MATCH_PROMPT,
      'interview-mock': INTERVIEW_MOCK_PROMPT,
      'general': '## 场景：通用对话\n\n你在进行通用的职位咨询对话，灵活使用各种组件块来增强回答效果。',
    }
    return buildSystemPrompt(scenePrompts[scene] || scenePrompts.general, contextData)
  }

  /**
   * 构建场景上下文数据
   */
  private async buildContext(
    dto: ChatDto,
    user: { id: string; email: string },
  ): Promise<string | undefined> {
    const parts: string[] = []

    // 如果有关联职位，加载职位信息
    if (dto.jobId) {
      const job = await this.jobRepo.findOne({ where: { id: dto.jobId } })
      if (job) {
        parts.push(`### 关联职位信息
- 标题: ${job.title}
- 公司: ${job.company}
- 城市: ${job.city || '未知'}
- 薪资: ${job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}K` : '面议'}
- 经验要求: ${job.experience || '未知'}
- 学历要求: ${job.education || '未知'}
- 技能标签: ${job.skills?.join(', ') || '无'}
- 职位描述: ${job.description || '无'}`)
      }
    }

    // 获取用户的技能信息
    const userEntity = await this.jobRepo.manager
      .getRepository(UserEntity)
      .findOne({ where: { id: user.id } })
    if (userEntity && userEntity.skills?.length > 0) {
      parts.push(`### 用户技能信息
- 技能: ${userEntity.skills.join(', ')}
- 目标城市: ${userEntity.targetCity || '未设置'}
- 期望薪资: ${userEntity.targetSalary ? `${userEntity.targetSalary}K` : '未设置'}`)
    }

    return parts.length > 0 ? parts.join('\n\n') : undefined
  }
}
