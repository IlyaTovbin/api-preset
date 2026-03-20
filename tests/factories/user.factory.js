import bcrypt from "bcrypt";
import { prisma } from "../../src/lib/prisma.js";

let sequence = 1;

export async function createUserFactory(overrides = {}) {
  const plainPassword = overrides.plainPassword || process.env.ADMIN_PASSWORD;
  if (!plainPassword) {
    throw new Error("Missing ADMIN_PASSWORD in environment");
  }
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(plainPassword, rounds);
  const email = overrides.email || `user${sequence++}@example.com`;
  const name = overrides.name || "Test User";

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
    },
  });

  return { user, plainPassword };
}
