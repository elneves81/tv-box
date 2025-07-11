"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
let redisClient;
async function connectRedis() {
    try {
        exports.redisClient = redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            password: process.env.REDIS_PASSWORD || undefined,
        });
        redisClient.on('error', (err) => {
            logger_1.logger.error('Redis Client Error:', err);
        });
        redisClient.on('connect', () => {
            logger_1.logger.info('Redis Client Connected');
        });
        redisClient.on('ready', () => {
            logger_1.logger.info('Redis Client Ready');
        });
        redisClient.on('end', () => {
            logger_1.logger.info('Redis Client Disconnected');
        });
        await redisClient.connect();
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Redis:', error);
        throw error;
    }
}
async function disconnectRedis() {
    try {
        if (redisClient) {
            await redisClient.quit();
            logger_1.logger.info('Redis disconnected successfully');
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to disconnect from Redis:', error);
        throw error;
    }
}
//# sourceMappingURL=redis.js.map