import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Conectado ao banco de dados');
  } catch (error) {
    logger.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

export { prisma };
