import { Controller, Post, Body, Get, Req, UseGuards, Res, HttpStatus, BadRequestException, Query, Param, Put, Delete, UnauthorizedException, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, refreshDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { UpdateUserDto } from './dto/update_user.dto';
import { forgotPasswordDto } from './dto/forgot-password.dto';
import { resetPasswordDto } from './dto/reset-password.dto';
import { userProfileDto } from './dto/user-profile-update.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ActivityLogService } from '@/activity_log/activity_log.service';
import { ApiResponse } from '@/common/helper/response.helper';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enum/role.enum';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
    constructor(
        private authService: AuthService,
        private readonly activityLogService: ActivityLogService
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('register')
    async register(@Body() dto: RegisterDto, @Res() res: Response, @Req() req: any) {
        try {
            const currentUser = req.user;
            const regiterRes = await this.authService.register(dto, currentUser);
            let result = JSON.stringify(regiterRes, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User Registered successfully."));
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Res() res: Response, @Req() req: any) {
        try {
            //  Verify captcha first
            // const captcha = await this.authService.verifyRecaptcha(
            //     dto.recaptchaToken,
            //     'login',
            // );

            // // Score-based decision
            // if (captcha.score < 0.5) {
            //     throw new UnauthorizedException('Suspicious activity detected');
            // }


            const loginres = await this.authService.login(dto, req);
            let result = JSON.stringify(loginres, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            // await this.activityLogService.createAdminActivityLog('LOGIN',
            //     `User ${dto.email} logged in.`,
            //     'Auth', req.ip, req.headers['user-agent'] || '');

            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User Login successfully."));
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
        // return this.authService.login(dto);
    }

    @Post('refresh')
    async refreshTokens(@Body() dto: refreshDto, @Res({ passthrough: true }) res: Response) {
        try {
            const tokens = await this.authService.refreshTokens(dto);

            let result = JSON.stringify(tokens, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Tokens refreshed successfully"));
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('me')
    async me(@Res() res: Response, @Req() req: any) {
        try {
            const userId = req.user.id;
            if (!userId) {
                throw new UnauthorizedException("Unauthorized")
            }
            const userData = await this.authService.getCurrentUser(userId);
            let result = JSON.stringify(userData, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User fetched successfully."));
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateUserProfile(
        @GetUser('id') userId: string,
        @Body() dto: userProfileDto, @Req() req: any,
        @Res({ passthrough: true }) res: Response
    ) {
        try {
            const userData = await this.authService.updateUserProfile(userId, dto);
            let result = JSON.stringify(userData, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );

            // await this.activityLogService.createAdminActivityLog('UPDATE',
            //     `User profile of ${req.user.email} [${req.user.role.name}] updated.`,
            //     'Profile', req.ip, req.headers['user-agent'] || '');
            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User profile updated successfully."));

        } catch (error: any) {
            throw new BadRequestException(error.response);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(
        @GetUser('id') userId: string,
        @GetUser('sid') sid: string, @Req() req: any,
        @Res({ passthrough: true }) res: Response) {
        try {
            const logout = await this.authService.logout(userId, sid);
            const resData = (
                new ApiResponse(null, 'Logout successful.')
            );
            // await this.activityLogService.createAdminActivityLog('LOGOUT',
            //     `User ${req.user.email} [${req.user.role.name}] logged out.`,
            //     'Auth', req.ip, req.headers['user-agent'] || '');
            return res.status(HttpStatus.OK).json(resData);
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    async logoutAll(
        @GetUser('sub') userId: string, @Req() req: any,
        @Res({ passthrough: true }) res: Response) {
        try {
            const logout = await this.authService.logoutAll(userId);
            const resData = (
                new ApiResponse(null, 'Logout successful from all device.')
            );
            // await this.activityLogService.createAdminActivityLog('LOGOUT',
            //     `User ${req.user.email} [${req.user.role.name}] logged out from all devices.`,
            //     'Auth', req.ip, req.headers['user-agent'] || '');
            return res.status(HttpStatus.OK).json(resData);
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @Post('forgot-password')
    async forgotPassword(@Body() dto: forgotPasswordDto, @Req() req: Request, @Res() res: Response) {
        try {
            let result = await this.authService.forgotPassword(dto);
            if (result) {
                return res.status(HttpStatus.OK).json(new ApiResponse(null, "Password reset request accepted. An email will be sent if the email exists."));
            } else {
                throw new BadRequestException(new ApiResponse(null, 'User not found.', false));
            }
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: resetPasswordDto, @Req() req: Request, @Res() res: Response) {
        try {
            let result = await this.authService.resetPassword(dto);
            if (result) {
                return res.status(HttpStatus.OK).json(new ApiResponse(null, "Your password has been reset successfully."));
            } else {
                throw new BadRequestException(new ApiResponse(null, 'Invalid or expired token', false));
            }
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get('user-all')
    async getAllUsers(@Res() res: Response, @Req() req: any, @Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('role') role: string = "", @Query('status') status: string = "", @Query('search') search: string = "") {
        try {
            const usersRes = await this.authService.getAllUsers(req.user, Number(page), Number(limit), search, role, status);
            let result = JSON.stringify(usersRes, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User fetched successfully."));
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get(':id')
    async getUserByuId(@Res() res: Response, @Req() req: any, @Param("id") userId: string) {
        try {
            const usersRes = await this.authService.getUserById(req.user, userId);
            let result = JSON.stringify(usersRes, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User fetched successfully."));
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Put(':id')
    async updateUser(@Res() res: Response, @Req() req: any, @Body() dto: UpdateUserDto, @Param("id") userId: string) {
        try {
            const usersRes = await this.authService.updateUser(req.user, userId, dto);
            let result = JSON.stringify(usersRes, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            // await this.activityLogService.createAdminActivityLog('Update', `Update User (${req.user.email}) by ${req.user.email}-Role: ${req.user.role.name}`, 'user', req.ip, req.headers['user-agent'] || '');
            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User fetched successfully."));
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    async deleteUser(@Res() res: Response, @Req() req: any, @Param("id") userId: string) {
        try {
            const usersRes = await this.authService.deleteUser(req.user, userId);
            let result = JSON.stringify(usersRes, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User deleted successfully."));
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }
}
