import { Module } from '@nestjs/common';
import { redisProvider } from '../providers/redis.provider';
import { RedisService } from '../services/redis.service';

@Module({
    providers: [redisProvider, RedisService],
    exports: [RedisService],
})
export class RedisModule {}
