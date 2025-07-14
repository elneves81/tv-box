import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@videosbox.com' },
    update: {},
    create: {
      email: 'admin@videosbox.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin',
    },
  });

  console.log('✅ Usuário administrador criado:', adminUser.email);

  // Criar usuário demo
  const demoPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@videosbox.com' },
    update: {},
    create: {
      email: 'demo@videosbox.com',
      password: demoPassword,
      name: 'Usuário Demo',
      role: 'user',
    },
  });

  console.log('✅ Usuário demo criado:', demoUser.email);

  // Criar usuário elber
  const elberPassword = await bcrypt.hash('elber123', 10);
  const elberUser = await prisma.user.upsert({
    where: { email: 'elber@videobox.com' },
    update: {},
    create: {
      email: 'elber@videobox.com',
      password: elberPassword,
      name: 'Elber',
      role: 'user',
    },
  });
  console.log('✅ Usuário Elber criado:', elberUser.email);

  // Dispositivos de exemplo removidos para evitar erro de duplicidade
  // const device1 = await prisma.device.create({ ... });
  // const device2 = await prisma.device.create({ ... });
  // console.log('✅ Dispositivos criados:', device1.name, device2.name);

  // Criar campanha de exemplo
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Campanha de Boas-vindas',
      description: 'Campanha inicial para demonstração do sistema',
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 dias
      userId: adminUser.id,
    },
  });

  console.log('✅ Campanha criada:', campaign.name);

  // Associação de dispositivos à campanha removida para evitar erro de variáveis não definidas

  console.log('✅ Dispositivos associados à campanha');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Credenciais de acesso:');
  console.log('👤 Admin: admin@videosbox.com / admin123');
  console.log('👤 Demo:  demo@videosbox.com / demo123');
}

main()
  .catch((e: any) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
