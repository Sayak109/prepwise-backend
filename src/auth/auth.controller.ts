import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
import { CommonDto } from './dto/common.dto';
import { ConfigService } from '@nestjs/config';
import { AuthRateLimitGuard } from '@/common/guards/auth-rate-limit.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  async check(
    @Body() dto: CommonDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const check = await this.authService.checkUser(dto);

      const result = JSON.stringify(check, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'User checked.'),
      );
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to check user.');
    }
  }

  @UseGuards(AuthRateLimitGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: CommonDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const loginData = await this.authService.auth(loginDto, req);

      const result = JSON.stringify(loginData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'Login successful.'),
      );
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error', error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to login user.');
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: CommonDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const registerData = await this.authService.registerStudent(dto, req);
      const result = JSON.stringify(registerData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'Registration successful.'),
      );
      return res.status(HttpStatus.CREATED).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to register user.');
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() dto: CommonDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const tokens = await this.authService.refreshTokens(dto.data);

      const resData = encryptData(
        new ApiResponse(tokens, 'Tokens refreshed successfully'),
      );
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to refresh tokens.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('me')
  async me(@Res() res: Response, @Req() req: any) {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new UnauthorizedException('Unauthorized');
      }
      const userData = await this.authService.getCurrentUser(userId);
      const result = JSON.stringify(userData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          new ApiResponse(JSON.parse(result), 'User fetched successfully.'),
        );
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetUser('sub') userId: string,
    @GetUser('sid') sid: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const logout = await this.authService.logout(userId, sid);
      const resData = new ApiResponse(null, 'Logout successful.');
      return res.status(HttpStatus.OK).json(resData);
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to logout user.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @GetUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const logout = await this.authService.logoutAll(userId);
      const resData = new ApiResponse(
        null,
        'Logout successful from all device.',
      );
      return res.status(HttpStatus.OK).json(resData);
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to update subscription plan.');
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: CommonDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.forgotPassword(dto);
      if (result) {
        return res
          .status(HttpStatus.OK)
          .json(
            new ApiResponse(
              null,
              'Password reset request accepted. An email will be sent if the email exists.',
            ),
          );
      } else {
        throw new BadRequestException(
          new ApiResponse(null, 'User not found.', false),
        );
      }
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to request password reset.');
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: CommonDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.resetPassword(dto);
      if (result) {
        return res
          .status(HttpStatus.OK)
          .json(
            new ApiResponse(null, 'Your password has been reset successfully.'),
          );
      } else {
        throw new BadRequestException(
          new ApiResponse(null, 'Invalid or expired token', false),
        );
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('test-encryption')
  async TestEncryption(@Res() res: Response, @Body() body: any) {
    try {
      const test = await this.authService.TestEncryption(body);
      const result = JSON.stringify(test, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), 'Encrypted data.'));
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to encrypt data.');
    }
  }
  @HttpCode(HttpStatus.CREATED)
  @Post('test-decryption')
  async TestDecryption(@Res() res: Response, @Body() body: any) {
    try {
      const test = await this.authService.TestDecryption(body);
      const result = JSON.stringify(test, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), 'Decrypted data.'));
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException('Failed to decrypt data.');
    }
  }
}
