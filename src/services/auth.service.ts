import * as bcrypt from 'bcrypt';
import {
    Injectable,
    HttpException,
    HttpStatus,
    ConflictException,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SignUpDto } from '../dto/sign-up.dto';
import { User } from '../models/users.model';
import { TokenService } from './tokens.service';
import { SignInDto } from '../dto/sign-in.dto';
import { UserTokenDto } from '../dto/user-token.dto';
import { IGenerateTokens } from '../interfaces/IGeneratedTokens';
import { RedisService } from './redis.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User) private userRepository: typeof User,
        private tokenService: TokenService,
        private redisService: RedisService,
    ) {}

    async signUp(dto: SignUpDto): Promise<void> {
        try {
            const existedUser = await this.userRepository.findOne({ where: { email: dto.email } });
            if (existedUser) {
                throw new ConflictException('User with this email already exists');
            }

            const hashedPassword = await bcrypt.hash(dto.password, 10);
            const user = await this.userRepository.create({ ...dto, password: hashedPassword });
            if (user && !['test', 'dev'].includes(process.env.NODE_ENV)) {
                const tokens = this.tokenService.generateTokens({ userId: user.id, email: user.email });
                await this.tokenService.saveToken({
                    userId: user.id,
                    email: user.email,
                    refreshToken: tokens.refreshToken,
                });
                const userTokensCache = await this.redisService.get('userTokens');
                if (!userTokensCache) {
                    await this.redisService.set(
                        'userTokens',
                        JSON.stringify([
                            { email: user.email, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
                        ]),
                    );
                } else {
                    const parsedData = JSON.parse(userTokensCache);
                    await this.redisService.set(
                        'userTokens',
                        JSON.stringify([
                            ...parsedData,
                            { email: user.email, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
                        ]),
                    );
                }
            }
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async signIn(dto: SignInDto): Promise<IGenerateTokens> {
        try {
            let userTokensCache = '';
            if (!['test', 'dev'].includes(process.env.NODE_ENV)) {
                userTokensCache = await this.redisService.get('userTokens');
                const tokensFromCache = JSON.parse(userTokensCache).filter((item) => item.email === dto.email)[0];
                if (tokensFromCache) {
                    const userData = await this.tokenService.validateRefreshToken(tokensFromCache.refreshToken);
                    if (!userData) {
                        throw new UnauthorizedException('Token validation failed');
                    }
                    return tokensFromCache;
                }
            }
            const user = await this.userRepository.findOne({ where: { email: dto.email } });
            if (!user) {
                throw new NotFoundException('User with this email not found');
            }
            const password = await bcrypt.compare(dto.password, user.password);
            if (!password) {
                throw new BadRequestException('Invalid password');
            }
            const dbToken = await this.tokenService.getTokenByUserId(user.id);
            if (dbToken) {
                await this.tokenService.removeToken(dbToken);
            }

            const tokens = this.tokenService.generateTokens({ userId: user.id, email: user.email });
            await this.tokenService.saveToken({
                userId: user.id,
                email: user.email,
                refreshToken: tokens.refreshToken,
            });

            if (!['test', 'dev'].includes(process.env.NODE_ENV)) {
                const parsedData = JSON.parse(userTokensCache);
                await this.redisService.set(
                    'userTokens',
                    JSON.stringify([
                        ...parsedData,
                        { email: user.email, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
                    ]),
                );
            }

            return tokens;
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async refresh(dto: UserTokenDto): Promise<IGenerateTokens> {
        try {
            const userData = await this.tokenService.validateRefreshToken(dto.refreshToken);
            const tokenFromDb = await this.tokenService.getTokenByUserId(dto.userId);

            if (!userData || !tokenFromDb) {
                throw new UnauthorizedException('Token validation failed');
            }

            const user = await this.userRepository.findOne({ where: { id: userData.userId } });
            const tokens = this.tokenService.generateTokens({ userId: user.id, email: user.email });
            await this.tokenService.saveToken(
                {
                    userId: user.id,
                    email: user.email,
                    refreshToken: tokens.refreshToken,
                },
                true,
            );

            if (!['test', 'dev'].includes(process.env.NODE_ENV)) {
                const userTokensCache = await this.redisService.get('userTokens');
                const tokensFromCache = JSON.parse(userTokensCache).filter((item) => item.email !== dto.email);
                if (tokensFromCache) {
                    await this.redisService.set(
                        'userTokens',
                        JSON.stringify([
                            ...tokensFromCache,
                            { email: user.email, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
                        ]),
                    );
                }
            }

            return tokens;
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async signOut(refreshToken: string): Promise<void> {
        try {
            await this.tokenService.removeToken(refreshToken);
        } catch (e) {
            console.log(e);

            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
