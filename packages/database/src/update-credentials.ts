import { prisma } from './index.js';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function updateUserAndSettings() {
  const email = process.env.ADMIN_DEFAULT_EMAIL || 'msaad.official6@gmail.com';
  const pass = process.env.ADMIN_DEFAULT_PASSWORD || 'Saad_@123';
  const hashedPassword = await bcrypt.hash(pass, 10);

  const ownerRole = await prisma.role.findUnique({ where: { slug: 'OWNER' } });
  if (!ownerRole) throw new Error('Owner role missing');

  // Upsert user
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash: hashedPassword },
    create: {
      email,
      passwordHash: hashedPassword,
    },
  });

  await prisma.adminRole.upsert({
    where: {
      adminId_roleId: {
        adminId: admin.id,
        roleId: ownerRole.id,
      },
    },
    update: {},
    create: {
      adminId: admin.id,
      roleId: ownerRole.id,
    },
  });

  // Update store name setting
  await prisma.systemSetting.upsert({
    where: { key: 'store_name' },
    update: { value: 'Delux Store' },
    create: {
      key: 'store_name',
      value: 'Delux Store',
      description: 'Store branding name',
    },
  });

  console.log(`✅ Owner admin configured: ${email}`);
  console.log(`✅ Store name set to: Delux Store`);
}

updateUserAndSettings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
