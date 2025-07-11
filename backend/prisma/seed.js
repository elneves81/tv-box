"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');
    const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
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
    const demoPassword = await bcryptjs_1.default.hash('demo123', 10);
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
            lastSeen: new Date(Date.now() - 1000 * 60 * 30),
        },
    });
    console.log('✅ Dispositivos criados:', device1.name, device2.name);
    const campaign = await prisma.campaign.create({
        data: {
            name: 'Campanha de Boas-vindas',
            description: 'Campanha inicial para demonstração do sistema',
            startDate: new Date(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            userId: adminUser.id,
        },
    });
    console.log('✅ Campanha criada:', campaign.name);
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
    .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map