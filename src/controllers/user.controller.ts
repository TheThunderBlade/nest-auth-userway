import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { UserService } from '../services/user.service';
import { IGuardedRequest } from 'src/interfaces/IGuardedRequest';
import responceHelper from 'src/helpers/responce.helper';
import { IResponceHelper } from 'src/interfaces/IResponceHelper';

@Controller('users')
export class UserController {
    constructor(private userService: UserService) {}

    @UseGuards(JwtAuthGuard)
    @Get('/getOne')
    async getOne(@Req() req: IGuardedRequest): Promise<IResponceHelper> {
        const { refreshToken } = req.cookies;
        const users = await this.userService.getOne(refreshToken);
        return responceHelper({ status: 200, data: users });
    }
}
