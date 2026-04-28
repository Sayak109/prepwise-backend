import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
@Injectable()

export class MailService {
    constructor(
        private readonly mailer: MailerService,
        private config: ConfigService,
        private prisma: PrismaService,
    ) { }

    async sendResetPasswordEmail(email: string, resetLink: string, token: string = '', isMobile: boolean = false) {
        const mailOptions = {
            to: email,
            subject: 'Reset your password',
            template: './forgot-password',
            context: {
                code: token,
                resetLink: resetLink,
                isMobile: isMobile
            }
        };

        await this.mailer.sendMail(mailOptions);
    }

    async sendOTPEmail(subject: string, email: string, otp: string) {
        try {
            const mailOptions = {
                to: email,
                subject: subject,
                template: './otp-email',
                context: {
                    otp: otp
                }
            };
            await this.mailer.sendMail(mailOptions);
        } catch (error) {
            throw error
        }
    }


}
