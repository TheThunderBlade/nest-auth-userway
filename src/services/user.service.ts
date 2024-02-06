import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/users.model';
import { Token } from 'src/models/tokens.model';

@Injectable()
export class UserService {
    constructor(@InjectModel(User) private userRepository: typeof User) {}

    async getOne(refreshToken: string) {
        try {
            return this.userRepository.findOne({
                attributes: ['id', 'email', 'createdAt'],
                include: [
                    {
                        model: Token,
                        attributes: [],
                        where: { refreshToken },
                    },
                ],
            });
        } catch (e) {
            throw new HttpException(
                { status: e.status || HttpStatus.INTERNAL_SERVER_ERROR, error: e.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
