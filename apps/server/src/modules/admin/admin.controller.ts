import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Logger,
  BadRequestException,
  Get,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../../common/guards/admin.guard'
import { AdminService } from './admin.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name)

  constructor(private readonly adminService: AdminService) {}

  /**
   * CSV 导入职位数据
   * POST /api/admin/import-jobs?mode=append|replace
   */
  @Post('import-jobs')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 限制
    fileFilter: (_req, file, cb) => {
      if (!file.originalname.endsWith('.csv')) {
        cb(new BadRequestException('仅支持 CSV 文件'), false)
      } else {
        cb(null, true)
      }
    },
  }))
  async importJobs(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode: 'append' | 'replace' = 'append',
    @CurrentUser() user: { id: string; email: string },
  ) {
    if (!file) {
      throw new BadRequestException('请上传 CSV 文件')
    }

    this.logger.log(`管理员 ${user.email} 导入职位数据, 模式: ${mode}, 文件: ${file.originalname}`)

    const result = await this.adminService.importJobsFromCSV(file.buffer, mode)

    this.logger.log(`导入完成: 总计 ${result.total}, 成功 ${result.success}, 失败 ${result.failed}`)

    return result
  }

  /**
   * 检查管理员状态
   * GET /api/admin/status
   */
  @Get('status')
  async getStatus(@CurrentUser() user: { id: string; email: string }) {
    return { isAdmin: true, email: user.email }
  }
}
