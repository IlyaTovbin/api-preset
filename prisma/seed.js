import "../env.js";
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const { PrismaClient } = prismaPkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("Missing ADMIN_PASSWORD in environment");
  }

  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, rounds);

  await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      name: "admin",
      password: passwordHash,
    },
    create: {
      email: "admin@gmail.com",
      name: "admin",
      password: passwordHash,
    },
  });

  console.log("Admin user seeded: admin@gmail.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
