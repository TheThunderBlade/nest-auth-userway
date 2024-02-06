import { Injectable, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Token } from '../models/tokens.model';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokensDto } from '../dto/generate-tokens.dto';
import { IGenerateTokens } from '../interfaces/IGeneratedTokens';
import { UserTokenDto } from '../dto/user-token.dto';
import { ITokens } from '../interfaces/ITokens';
import { IValidatedToken } from '../interfaces/IValidatedToken';

@Injectable()
export class TokenService {
    constructor(
        @InjectModel(Token) private tokenRepository: typeof Token,
        private jwtService: JwtService,
    ) {}

    generateTokens(dto: GenerateTokensDto): IGenerateTokens {
        try {
            const accessToken = this.jwtService.sign(dto, { expiresIn: '30m' });
            const refreshToken = this.jwtService.sign(dto);

            return {
                accessToken,
                refreshToken,
            };
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async saveToken(dto: UserTokenDto, isRefresh = false): Promise<ITokens> {
        const tokenData = await this.tokenRepository.findOne({ where: { userId: dto.userId } });
        if (tokenData && !isRefresh) {
            throw new ConflictException('User is already signed in');
        }
        try {
            return isRefresh
                ? tokenData.update({
                      refreshToken: dto.refreshToken,
                  })
                : this.tokenRepository.create({
                      userId: dto.userId,
                      refreshToken: dto.refreshToken,
                  });
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async validateRefreshToken(refreshToken: string): Promise<IValidatedToken> {
        try {
            return this.jwtService.verify(refreshToken);
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getTokenByUserId(userId: number): Promise<string> {
        try {
            const dbToken = await this.tokenRepository.findOne({ where: { userId } });
            return dbToken?.refreshToken || null;
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async removeToken(refreshToken: string): Promise<void> {
        try {
            await this.tokenRepository.destroy({ where: { refreshToken } });
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
