import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password untuk super admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Buat Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'admin@smpit.sch.id',
      password: hashedPassword,
      nama: 'Super Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super Admin created:', {
    username: superAdmin.username,
    email: superAdmin.email,
    role: superAdmin.role,
  });

  // Buat Bendahara
  const treasurer = await prisma.user.upsert({
    where: { username: 'bendahara' },
    update: {},
    create: {
      username: 'bendahara',
      email: 'bendahara@smpit.sch.id',
      password: await bcrypt.hash('bendahara123', 10),
      nama: 'Bendahara SMPIT',
      role: 'TREASURER',
      isActive: true,
    },
  });

  console.log('✅ Treasurer created:', {
    username: treasurer.username,
    email: treasurer.email,
    role: treasurer.role,
  });

  // Buat Kepala Sekolah
  const headmaster = await prisma.user.upsert({
    where: { username: 'kepsek' },
    update: {},
    create: {
      username: 'kepsek',
      email: 'kepsek@smpit.sch.id',
      password: await bcrypt.hash('kepsek123', 10),
      nama: 'Kepala Sekolah SMPIT',
      role: 'HEADMASTER',
      isActive: true,
    },
  });

  console.log('✅ Headmaster created:', {
    username: headmaster.username,
    email: headmaster.email,
    role: headmaster.role,
  });

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📝 Default accounts:');
  console.log('   Super Admin: superadmin / admin123');
  console.log('   Bendahara: bendahara / bendahara123');
  console.log('   Kepala Sekolah: kepsek / kepsek123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
