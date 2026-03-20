import "../../env.js";
import { afterAll, beforeAll, beforeEach } from "vitest";

if (!process.env.DATABASE_URL_TEST) {
  throw new Error("Missing DATABASE_URL_TEST in environment");
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

let prisma;

beforeAll(async () => {
  const prismaModule = await import("../../src/lib/prisma.js");
  prisma = prismaModule.prisma;
});

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});
