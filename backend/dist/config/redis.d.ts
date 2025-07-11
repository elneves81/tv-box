import { RedisClientType } from 'redis';
declare let redisClient: RedisClientType;
export declare function connectRedis(): Promise<void>;
export declare function disconnectRedis(): Promise<void>;
export { redisClient };
//# sourceMappingURL=redis.d.ts.map