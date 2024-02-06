import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { User } from '../models/users.model';
import { Token } from '../models/tokens.model';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../services/tokens.service';
import configImports from '../imports/config.imports';
import { RedisModule } from './redis.module';

@Module({
    controllers: [AuthController],
    providers: [AuthService, TokenService],
    imports: [
        configImports,
        SequelizeModule.forFeature([User, Token]),
        RedisModule,
        JwtModule.register({
            secret: process.env.PRIVATE_KEY,
            signOptions: {
                expiresIn: '30d',
            },
        }),
    ],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
