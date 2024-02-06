import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import configImports from '../imports/config.imports';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { User } from '../models/users.model';
import { Token } from '../models/tokens.model';
import { AuthModule } from './auth.module';

@Module({
    controllers: [UserController],
    providers: [UserService],
    imports: [configImports, SequelizeModule.forFeature([User, Token]), AuthModule],
    exports: [UserService],
})
export class UserModule {}
