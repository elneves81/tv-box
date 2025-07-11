import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@videosbox.com',
      password: 'admin123', // Em produção, usar hash
      name: 'Administrador',
      role: 'admin',
    },
  });

  console.log('✅ Usuário administrador criado:', adminUser.email);

  // Criar dispositivo de exemplo
  const device = await prisma.device.create({
    data: {
      name: 'TV Sala Principal',
      identifier: 'TV-SALA-001',
      location: 'Sala Principal',
      isOnline: true,
    },
  });

  console.log('✅ Dispositivo criado:', device.name);

  // Criar campanha de exemplo
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Campanha Demo',
      description: 'Campanha de demonstração',
      userId: adminUser.id,
    },
  });

  console.log('✅ Campanha criada:', campaign.name);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('📋 Credenciais: admin@videosbox.com / admin123');
}

main()
  .catch((e: any) => {
    console.error('❌ Erro durante o seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
