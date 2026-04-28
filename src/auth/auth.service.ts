import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthMethod, Status, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import {
    decryptData,
    encryptData,
    generateRandomID,
    hashPassword,
} from '@/common/helper/common.helper';
import {
    handleAuthFailure,
    resetAuthLimits,
} from '@/common/helper/rate-limit.helper';
import { MailService } from '@/mail/mail.service';
import { OtpService } from '@/otp/otp.service';
import { CommonDto } from './dto/common.dto';
import { forgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto, refreshDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { resetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update_user.dto';
import { userProfileDto } from './dto/user-profile-update.dto';
import { Tokens } from './types/tokens.type';
import { PrismaService } from '@/prisma/prisma.service';
import { CryptoUtil } from '@/common/utils/crypto.util';

type AuthPayload = {
    auth_method?: AuthMethod;
    email?: string;
    phone_no?: string;
    password?: string;
    otp?: number;
    provider_id?: string;
    first_name?: string;
    last_name?: string;
};

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private mailService: MailService,
        private otpService: OtpService,
    ) { }

    async checkUser(commonDto: CommonDto) {
        const payload = this.getBody<AuthPayload>(commonDto);
        const credential = payload?.email ?? payload?.phone_no ?? payload?.['credential'];

        if (!credential || typeof credential !== 'string') {
            return { is_exists: false, is_admin: false };
        }

        const normalizedCredential = credential.trim();
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: normalizedCredential, mode: 'insensitive' } },
                    { phoneNo: normalizedCredential },
                ],
            },
            select: { id: true, role: true },
        });

        return {
            is_exists: !!user,
            is_admin: user?.role === UserRole.ADMIN,
        };
    }

    async auth(commonDto: CommonDto, req: Request): Promise<Tokens> {
        const payload = this.getBody<AuthPayload>(commonDto);
        const authMethod = payload.auth_method;

        if (!authMethod || !Object.values(AuthMethod).includes(authMethod)) {
            throw new BadRequestException('Valid auth method required');
        }

        const email = this.normalizeEmail(payload.email);
        const phoneNo = payload.phone_no?.trim();

        if (['EMAIL_PW', 'EMAIL_OTP', 'PHONE_OTP'].includes(authMethod)) {
            await this.verifyAuth(payload, req.ip as string);
        }

        let user = await this.findAuthUser(authMethod, email, phoneNo);

        if (user?.status === Status.INACTIVE) {
            throw new BadRequestException('Sorry, your account is suspended.');
        }

        if (authMethod === AuthMethod.GOOGLE || authMethod === AuthMethod.APPLE) {
            user = await this.handleProviderAuth(user, payload, req.ip as string);
        }

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    firstName: payload.first_name,
                    lastName: payload.last_name,
                    email,
                    phoneNo,
                    authMethod,
                    passwordHash: await hashPassword(payload.password ?? randomUUID()),
                    role: UserRole.STUDENT,
                    status: Status.ACTIVE,
                },
                select: this.authUserSelect(),
            });
        }

        const { session, refreshPlain } = await this.createSession(user, req);

        return {
            accessToken: this.signAccessToken(user, session.sessionId),
            refreshToken: encryptData(refreshPlain),
        };
    }

    async register(dto: RegisterDto, currentUser?: any) {
        if (currentUser && currentUser.role?.title !== UserRole.ADMIN) {
            throw new UnauthorizedException('Only admins can register users.');
        }

        const email = this.normalizeEmail(dto.email);
        if (!email) throw new BadRequestException('Email is required');

        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (exists) throw new BadRequestException('Email already exists');

        const { firstName, lastName } = this.splitName(dto.name);
        const user = await this.prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                passwordHash: await hashPassword(dto.password),
                role: this.toUserRole(dto.role, UserRole.STUDENT),
                status: this.toStatus(dto.status, Status.ACTIVE),
                authMethod: AuthMethod.EMAIL_PW,
            },
            select: this.publicUserSelect(),
        });

        return user;
    }

    async login(dto: LoginDto, req: Request): Promise<Tokens> {
        const email = this.normalizeEmail(dto.email);
        if (!email || !dto.password) {
            throw new BadRequestException('Email and password are required');
        }

        const user = await this.prisma.user.findUnique({
            where: { email },
            select: this.authUserSelect(true),
        });

        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            await handleAuthFailure(email, req.ip as string);
            throw new BadRequestException('Invalid credentials');
        }

        if (user.status === Status.INACTIVE) {
            throw new BadRequestException('Sorry, your account is suspended.');
        }

        await resetAuthLimits(email, req.ip as string);

        const { session, refreshPlain } = await this.createSession(user, req);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return {
            accessToken: this.signAccessToken(user, session.sessionId),
            refreshToken: encryptData(refreshPlain),
        };
    }

    private async verifyAuth(payload: AuthPayload, ip: string) {
        const authMethod = payload.auth_method;
        const email = this.normalizeEmail(payload.email);
        const phoneNo = payload.phone_no?.trim();
        const identifier =
            authMethod === AuthMethod.PHONE_OTP ? phoneNo : email;

        if (!identifier) {
            throw new BadRequestException('Credential is required');
        }

        if (authMethod === AuthMethod.EMAIL_PW) {
            const user = email
                ? await this.prisma.user.findUnique({ where: { email } })
                : null;

            if (!user || !(await bcrypt.compare(payload.password ?? '', user.passwordHash))) {
                await handleAuthFailure(identifier, ip);
                throw new BadRequestException('Invalid credentials');
            }

            await resetAuthLimits(identifier, ip);
            return true;
        }

        if (authMethod === AuthMethod.EMAIL_OTP) {
            if (!email || !payload.otp) {
                throw new BadRequestException('Email and OTP required');
            }

            try {
                await this.otpService.verifyOtp({
                    credential: email,
                    is_email: true,
                    otp: Number(payload.otp),
                });
                await resetAuthLimits(identifier, ip);
                return true;
            } catch (error) {
                await handleAuthFailure(identifier, ip);
                throw error;
            }
        }

        if (authMethod === AuthMethod.PHONE_OTP) {
            if (!phoneNo || !payload.otp) {
                throw new BadRequestException('Phone number and OTP required');
            }

            try {
                await this.otpService.verifyOtp({
                    credential: phoneNo,
                    is_email: false,
                    otp: Number(payload.otp),
                });
                await resetAuthLimits(identifier, ip);
                return true;
            } catch (error) {
                await handleAuthFailure(identifier, ip);
                throw error;
            }
        }

        throw new BadRequestException('Invalid authentication method');
    }

    async createSession(user: any, req?: Request) {
        const refreshPlain = randomUUID() + randomUUID();
        const refreshHash = CryptoUtil.hash(refreshPlain);
        const userAgent = req?.headers['user-agent'];

        const session = await this.prisma.userSession.create({
            data: {
                sessionId: randomUUID(),
                userId: user.id,
                ipAddress: req?.ip,
                userAgent,
                deviceInfo: userAgent ? { userAgent } : undefined,
                refreshTokenHash: refreshHash,
                refreshTokenEncrypted: encryptData(refreshPlain),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        return { session, refreshPlain };
    }

    async refreshTokens(dto: refreshDto | CommonDto | string): Promise<Tokens> {
        const refreshToken = this.extractRefreshToken(dto);
        if (!refreshToken) {
            throw new BadRequestException('Refresh token required');
        }

        const session = await this.prisma.userSession.findFirst({
            where: {
                refreshTokenHash: CryptoUtil.hash(refreshToken),
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: {
                    select: this.authUserSelect(),
                },
            },
        });

        if (!session) {
            throw new BadRequestException('Session expired');
        }

        const newPlain = randomUUID() + randomUUID();
        await this.prisma.userSession.update({
            where: { id: session.id },
            data: {
                refreshTokenHash: CryptoUtil.hash(newPlain),
                refreshTokenEncrypted: encryptData(newPlain),
                lastUsedAt: new Date(),
            },
        });

        return {
            accessToken: this.signAccessToken(session.user, session.sessionId),
            refreshToken: encryptData(newPlain),
        };
    }

    async logout(userId: string, sid: string) {
        await this.prisma.userSession.updateMany({
            where: {
                userId: String(userId),
                sessionId: sid,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
                lastUsedAt: new Date(),
            },
        });
        return true;
    }

    async logoutAll(userId: string) {
        await this.prisma.userSession.updateMany({
            where: {
                userId: String(userId),
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
                lastUsedAt: new Date(),
            },
        });
        return true;
    }

    async forgotPassword(dto: forgotPasswordDto | CommonDto) {
        const payload = this.getBody<any>(dto);
        const email = this.normalizeEmail(payload.email);
        if (!email) throw new BadRequestException('Email is required');

        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user?.email) {
            throw new BadRequestException('Email address not found.');
        }

        const resettableAuthMethods: AuthMethod[] = [
            AuthMethod.EMAIL_OTP,
            AuthMethod.EMAIL_PW,
        ];
        if (!resettableAuthMethods.includes(user.authMethod)) {
            throw new BadRequestException(
                `Account created with 'Continue with ${this.toTitle(user.authMethod)}'`,
            );
        }

        const token = await generateRandomID(12);
        const expiryMinutes = 5;
        const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExp: expiry },
        });

        const resetLink = `${this.config.get('WEB_BASE_PATH') ?? ''}/admin/forgot-password?token=${token}`;
        setImmediate(async () => {
            try {
                await this.mailService.sendResetPasswordEmail(user.email!, resetLink, token);
            } catch (error) {
                console.error('Error sending reset password email', error);
            }
        });

        return true;
    }

    async resetPassword(dto: resetPasswordDto | CommonDto) {
        const payload = this.getBody<any>(dto);
        const token = payload.token;
        const newPassword = payload.new_password ?? payload.newPassword;

        if (!token || !newPassword) {
            throw new BadRequestException('Token and new password are required');
        }

        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExp: { gt: new Date() },
            },
        });

        if (!user) return false;

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: await hashPassword(newPassword),
                resetToken: null,
                resetTokenExp: null,
                authMethod: AuthMethod.EMAIL_PW,
            },
        });

        return true;
    }

    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: this.publicUserSelect(),
        });

        if (!user) throw new BadRequestException('User not found');
        return this.withRoleObject(user);
    }

    async updateUserProfile(userId: string, dto: userProfileDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        if (dto.new_password) {
            if (!dto.old_password) {
                throw new BadRequestException('Old password is required');
            }
            const validPassword = await bcrypt.compare(dto.old_password, user.passwordHash);
            if (!validPassword) throw new BadRequestException('Old password is invalid');
        }

        const name = dto.name ? this.splitName(dto.name) : {};
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...name,
                email: dto.email ? this.normalizeEmail(dto.email) : undefined,
                passwordHash: dto.new_password ? await hashPassword(dto.new_password) : undefined,
            },
            select: this.publicUserSelect(),
        });

        return this.withRoleObject(updated);
    }

    async getAllUsers(
        _currentUser: any,
        page = 1,
        limit = 10,
        search = '',
        role = '',
        status = '',
    ) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (role && Object.values(UserRole).includes(role as UserRole)) {
            where.role = role as UserRole;
        }
        if (status && Object.values(Status).includes(status as Status)) {
            where.status = status as Status;
        }
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phoneNo: { contains: search } },
            ];
        }

        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: this.publicUserSelect(),
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            items: items.map((user) => this.withRoleObject(user)),
            total,
            page,
            limit,
        };
    }

    async getUserById(_currentUser: any, userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: this.publicUserSelect(),
        });

        if (!user) throw new BadRequestException('User not found');
        return this.withRoleObject(user);
    }

    async updateUser(_currentUser: any, userId: string, dto: UpdateUserDto) {
        const name = dto.name ? this.splitName(dto.name) : {};
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...name,
                email: dto.email ? this.normalizeEmail(dto.email) : undefined,
                role: dto.role ? this.toUserRole(dto.role, UserRole.STUDENT) : undefined,
                status: dto.status ? this.toStatus(dto.status, Status.ACTIVE) : undefined,
                passwordHash: dto.password ? await hashPassword(dto.password) : undefined,
            },
            select: this.publicUserSelect(),
        });

        return this.withRoleObject(updated);
    }

    async deleteUser(_currentUser: any, userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { status: Status.INACTIVE },
            select: this.publicUserSelect(),
        });
    }

    async TestEncryption(body: any) {
        return encryptData(body);
    }

    async TestDecryption(body: any) {
        return decryptData(body.data);
    }

    private async findAuthUser(authMethod: AuthMethod, email?: string, phoneNo?: string) {
        const emailAuthMethods: AuthMethod[] = [
            AuthMethod.EMAIL_PW,
            AuthMethod.EMAIL_OTP,
            AuthMethod.GOOGLE,
            AuthMethod.APPLE,
        ];
        if (emailAuthMethods.includes(authMethod) && email) {
            return this.prisma.user.findUnique({
                where: { email },
                select: this.authUserSelect(true),
            });
        }

        if (authMethod === AuthMethod.PHONE_OTP && phoneNo) {
            return this.prisma.user.findUnique({
                where: { phoneNo },
                select: this.authUserSelect(true),
            });
        }

        return null;
    }

    private async handleProviderAuth(user: any, payload: AuthPayload, ip: string) {
        const authMethod = payload.auth_method!;
        const email = this.normalizeEmail(payload.email);

        if (!payload.provider_id || !email) {
            throw new BadRequestException('Provider ID and email are required');
        }

        if (!user) {
            return this.prisma.user.create({
                data: {
                    firstName: payload.first_name,
                    lastName: payload.last_name,
                    email,
                    authMethod,
                    providerId: await hashPassword(payload.provider_id),
                    passwordHash: await hashPassword(randomUUID()),
                    role: UserRole.STUDENT,
                    status: Status.ACTIVE,
                },
                select: this.authUserSelect(true),
            });
        }

        if (user.authMethod !== authMethod) {
            throw new BadRequestException(
                `Invalid login method. Please log in using ${this.toTitle(user.authMethod)}.`,
            );
        }

        const validProvider = user.providerId
            ? await bcrypt.compare(payload.provider_id, user.providerId)
            : false;

        if (!validProvider) {
            await handleAuthFailure(email, ip);
            throw new BadRequestException('Invalid credentials');
        }

        await resetAuthLimits(email, ip);
        return user;
    }

    private signAccessToken(user: any, sessionId: string) {
        return this.jwtService.sign(
            {
                sub: user.id,
                email: user.email,
                role: user.role,
                sid: sessionId,
                status: user.status,
            },
            {
                secret: this.config.get<string>('JWT_SECRET'),
                expiresIn:
                    (this.config.get<string>('JWT_EXPIRATION') ??
                        this.config.get<string>('JWT_EXPIRES_IN') ??
                        '1d') as any,
            },
        );
    }

    private getBody<T extends Record<string, any>>(dto: any): T {
        if (dto?.data) {
            const decrypted = decryptData(dto.data);
            if (!decrypted) throw new BadRequestException('Invalid encrypted payload');
            return decrypted;
        }

        return dto ?? {};
    }

    private extractRefreshToken(dto: refreshDto | CommonDto | string): string | null {
        const tokenValue =
            typeof dto === 'string' ? dto : dto?.['refreshToken'] ?? dto?.['data'];

        if (!tokenValue || typeof tokenValue !== 'string') return null;

        const decrypted = decryptData(tokenValue);
        if (!decrypted) return tokenValue;
        if (typeof decrypted === 'string') return decrypted;
        if (typeof decrypted.refreshToken === 'string') {
            const nested = decryptData(decrypted.refreshToken);
            return typeof nested === 'string' ? nested : decrypted.refreshToken;
        }

        return null;
    }

    private normalizeEmail(email?: string | null) {
        return email?.trim().toLowerCase() || undefined;
    }

    private splitName(name?: string) {
        const [firstName, ...rest] = (name ?? '').trim().split(/\s+/).filter(Boolean);
        return {
            firstName: firstName || undefined,
            lastName: rest.join(' ') || undefined,
        };
    }

    private toUserRole(role: unknown, fallback: UserRole) {
        return Object.values(UserRole).includes(role as UserRole)
            ? (role as UserRole)
            : fallback;
    }

    private toStatus(status: unknown, fallback: Status) {
        return Object.values(Status).includes(status as Status)
            ? (status as Status)
            : fallback;
    }

    private toTitle(value: string) {
        return value.replace(/_/g, ' ').toLowerCase();
    }

    private authUserSelect(withSecret = false) {
        return {
            id: true,
            email: true,
            phoneNo: true,
            firstName: true,
            lastName: true,
            authMethod: true,
            providerId: withSecret,
            passwordHash: withSecret,
            role: true,
            status: true,
        };
    }

    private publicUserSelect() {
        return {
            id: true,
            email: true,
            phoneNo: true,
            firstName: true,
            lastName: true,
            authMethod: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        };
    }

    private withRoleObject(user: any) {
        return {
            ...user,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
            role: user.role,
        };
    }
}
