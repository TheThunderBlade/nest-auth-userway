import { Response, Request } from 'express';
import { Controller, Post, Body, Res, Req, Get, UseGuards } from '@nestjs/common';
import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { IGuardedRequest } from '../interfaces/IGuardedRequest';
import responceHelper from '../helpers/responce.helper';
import { IResponceHelper } from '../interfaces/IResponceHelper';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('/signUp')
    async signUp(@Body() signUpDto: SignUpDto): Promise<IResponceHelper> {
        await this.authService.signUp(signUpDto);

        return responceHelper({ status: 200, message: 'User has been successfully created' });
    }

    @Post('/signIn')
    async signIn(@Res({ passthrough: true }) res: Response, @Body() signInDto: SignInDto): Promise<IResponceHelper> {
        const token = await this.authService.signIn(signInDto);

        res.cookie('refreshToken', token.refreshToken);

        return responceHelper({ status: 200, data: token.accessToken });
    }

    @UseGuards(JwtAuthGuard)
    @Get('/refresh')
    async refresh(@Req() req: IGuardedRequest, @Res({ passthrough: true }) res: Response): Promise<IResponceHelper> {
        const { user } = req;
        const { refreshToken } = req.cookies;

        const tokens = await this.authService.refresh({ userId: user.id, email: user.email, refreshToken });
        res.cookie('refreshToken', tokens.refreshToken);

        return responceHelper({ status: 200, data: tokens.accessToken });
    }

    @UseGuards(JwtAuthGuard)
    @Get('/signOut')
    async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<IResponceHelper> {
        const { refreshToken } = req.cookies;

        await this.authService.signOut(refreshToken);
        res.clearCookie('refreshToken');

        return responceHelper({ status: 200, message: 'User has been successfully signed out' });
    }
}
