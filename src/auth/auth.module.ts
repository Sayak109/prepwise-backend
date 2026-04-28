import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '@/mail/mail.module';
import { OtpModule } from '@/otp/otp.module';
import { ActivityLogModule } from '@/activity_log/activity_log.module';
// import type { StringValue } from 'jsonwebtoken';

@Module({
    imports: [
        MailModule,
        OtpModule,
        ActivityLogModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService): JwtModuleOptions => {
                const expiresIn: any =
                    (config.get<string>('JWT_EXPIRES_IN') as String) ?? '1d';

                return {
                    secret: config.getOrThrow<string>('JWT_SECRET'),
                    signOptions: {
                        expiresIn,
                    },
                };
            },
        }),
        // CommonModule
    ],
    providers: [AuthService, JwtStrategy,],
    controllers: [AuthController,],
})
export class AuthModule { }
