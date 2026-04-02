import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { JobModule } from './modules/job/job.module'
import { AnalysisModule } from './modules/analysis/analysis.module'
import { AiModule } from './modules/ai/ai.module'
import { AdminModule } from './modules/admin/admin.module'

@Module({
  imports: [
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    // TypeORM 数据库连接
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER', 'jobRadar'),
        password: config.get('DATABASE_PASSWORD', 'jobRadar123'),
        database: config.get('DATABASE_NAME', 'jobRadar'),
        autoLoadEntities: true,
        synchronize: true, // 开发环境自动同步 schema，生产环境关闭
      }),
    }),

    // 业务模块
    AuthModule,
    UserModule,
    JobModule,
    AnalysisModule,
    AiModule,
    AdminModule,
  ],
})
export class AppModule {}
