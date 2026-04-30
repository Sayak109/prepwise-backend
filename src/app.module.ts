import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ActivityLogModule } from './activity_log/activity_log.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { PracticeModule } from './practice/practice.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    OtpModule,
    ActivityLogModule,
    AdminModule,
    PracticeModule,
    TestModule,
  ],
})
export class AppModule {}
