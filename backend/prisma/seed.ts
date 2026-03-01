import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Pool } from "pg";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
  { action: "create", subject: "Role" },
  { action: "read", subject: "Role" },
  { action: "update", subject: "Role" },
  { action: "delete", subject: "Role" },
  { action: "create", subject: "Permission" },
  { action: "read", subject: "Permission" },
  { action: "delete", subject: "Permission" },
  { action: "read", subject: "User" },
  { action: "update", subject: "User" },
];

async function main() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

  await Promise.all(
    PERMISSIONS.map((perm) =>
      prisma.permission.upsert({
        where: {
          action_subject: {
            action: perm.action,
            subject: perm.subject,
          },
        },
        update: {},
        create: perm,
      }),
    ),
  );

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "System administrator",
    },
  });

  const allPermissions = await prisma.permission.findMany();

  await Promise.all(
    allPermissions.map((perm) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      }),
    ),
  );

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log("Database successfully seeded");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
