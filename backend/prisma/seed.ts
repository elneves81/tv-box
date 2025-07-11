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

  // Criar dispositivos de exemplo
  const device1 = await prisma.device.create({
    data: {
      name: 'TV Sala Principal',
      identifier: 'TV-SALA-001',
      location: 'Sala Principal',
      isOnline: true,
      lastSeen: new Date(),
    },
  });

  const device2 = await prisma.device.create({
    data: {
      name: 'TV Recepção',
      identifier: 'TV-RECEPCAO-002',
      location: 'Recepção',
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    },
  });

  console.log('✅ Dispositivos criados:', device1.name, device2.name);

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

  // Associar dispositivos à campanha
  await prisma.campaignDevice.createMany({
    data: [
      { campaignId: campaign.id, deviceId: device1.id },
      { campaignId: campaign.id, deviceId: device2.id },
    ],
  });

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
