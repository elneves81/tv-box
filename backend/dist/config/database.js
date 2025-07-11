"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
async function connectDatabase() {
    try {
        await prisma.$connect();
        logger_1.logger.info('Conectado ao banco de dados');
    }
    catch (error) {
        logger_1.logger.error('Erro ao conectar ao banco de dados:', error);
        throw error;
    }
}
//# sourceMappingURL=database.js.map