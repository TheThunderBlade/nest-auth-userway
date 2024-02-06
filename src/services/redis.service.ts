import { Inject, Injectable } from '@nestjs/common';
import { RedisClient } from '../providers/redis.provider';

@Injectable()
export class RedisService {
    public constructor(
        @Inject('REDIS_CLIENT')
        private readonly client: RedisClient,
    ) {}

    async set(key: string, value: string, expirationSeconds?: number) {
        if (expirationSeconds) {
            await this.client.set(key, value, 'EX', expirationSeconds);
        } else {
            await this.client.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }
}
