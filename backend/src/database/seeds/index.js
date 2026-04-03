import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function seedDatabase() {
  console.log('Seeding database...')

  const planos = await Promise.all([
    prisma.plano.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        nome: 'Starter',
        descricao: 'Para advogados solo e pequenos escritórios',
        preco: 99.00,
        maxUsuarios: 3,
        maxProcessos: 100,
        maxStorageMb: 2048,
        temIA: false,
        temMonitoramento: true,
        temPortalCliente: false,
      },
    }),
    prisma.plano.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        nome: 'Profissional',
        descricao: 'Para escritórios em crescimento',
        preco: 299.00,
        maxUsuarios: 15,
        maxProcessos: 1000,
        maxStorageMb: 20480,
        temIA: true,
        temMonitoramento: true,
        temPortalCliente: true,
      },
    }),
    prisma.plano.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        nome: 'Enterprise',
        descricao: 'Para grandes escritórios',
        preco: 799.00,
        maxUsuarios: 999,
        maxProcessos: 999999,
        maxStorageMb: 512000,
        temIA: true,
        temMonitoramento: true,
        temPortalCliente: true,
      },
    }),
  ])

  console.log('Plans created:', planos.map(p => p.nome))

  const senhaHash = await bcrypt.hash('Admin@123', 12)

  const superAdmin = await prisma.usuario.upsert({
    where: { id: '00000000-0000-0000-0000-000000000099' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000099',
      nome: 'Super Administrador',
      email: 'admin@juridicosaas.com.br',
      senha: senhaHash,
      role: 'super_admin',
      tenantId: null,
    },
  })

  console.log('Super admin created:', superAdmin.email)

  const demoTenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      nome: 'Escritório Demo',
      email: 'demo@escritoriodemo.com.br',
      planoId: '00000000-0000-0000-0000-000000000002',
    },
  })

  await prisma.assinatura.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      tenantId: demoTenant.id,
      planoId: '00000000-0000-0000-0000-000000000002',
      status: 'ativa',
    },
  })

  const demoAdmin = await prisma.usuario.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      tenantId: demoTenant.id,
      nome: 'Dr. João Silva',
      email: 'joao@escritoriodemo.com.br',
      senha: senhaHash,
      role: 'admin_escritorio',
      oab: 'OAB/SP 123456',
      areasAtuacao: ['Cível', 'Trabalhista'],
    },
  })

  console.log('Demo admin created:', demoAdmin.email)

  // Criar áreas de atuação padrão
  const areasAtuacao = await Promise.all([
    prisma.areaAtuacao.upsert({
      where: { id: '00000000-0000-0000-0000-000000000100' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000100',
        tenantId: demoTenant.id,
        nome: 'Direito Cível',
        descricao: 'Processos cíveis em geral',
        cor: '#2196F3',
        ordem: 1,
      },
    }),
    prisma.areaAtuacao.upsert({
      where: { id: '00000000-0000-0000-0000-000000000101' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000101',
        tenantId: demoTenant.id,
        nome: 'Direito Trabalhista',
        descricao: 'Processos trabalhistas',
        cor: '#4CAF50',
        ordem: 2,
      },
    }),
    prisma.areaAtuacao.upsert({
      where: { id: '00000000-0000-0000-0000-000000000102' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000102',
        tenantId: demoTenant.id,
        nome: 'Direito Previdenciário',
        descricao: 'Processos previdenciários',
        cor: '#FF9800',
        ordem: 3,
      },
    }),
  ])

  console.log('Areas de atuacao created:', areasAtuacao.map(a => a.nome))

  // Criar centros de custo padrão
  const centrosCusto = await Promise.all([
    prisma.centroCusto.upsert({
      where: { id: '00000000-0000-0000-0000-000000000200' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000200',
        tenantId: demoTenant.id,
        codigo: 'RECEITA',
        nome: 'Receitas',
        tipo: 'receita',
      },
    }),
    prisma.centroCusto.upsert({
      where: { id: '00000000-0000-0000-0000-000000000201' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000201',
        tenantId: demoTenant.id,
        codigo: 'DESPESA',
        nome: 'Despesas',
        tipo: 'despesa',
      },
    }),
  ])

  console.log('Centros de custo created:', centrosCusto.map(c => c.nome))

  console.log('Seeding complete!')
}

// Execução direta via: node src/database/seeds/index.js
if (process.argv[1].includes('seeds/index')) {
  seedDatabase()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
