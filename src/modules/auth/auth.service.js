import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";

const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";

function getRefreshDays() {
  const raw = process.env.JWT_REFRESH_DAYS || "30";
  const days = Number(raw);
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("JWT_REFRESH_DAYS must be a positive number");
  }
  return days;
}

function toRefreshExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + getRefreshDays());
  return date;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function buildTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
  };
}

function buildRefreshPayload(user, jti) {
  return {
    sub: user.id,
    jti,
  };
}

async function issueSession(user) {
  const accessToken = signAccessToken(buildTokenPayload(user));
  const jti = randomUUID();
  const refreshToken = signRefreshToken(buildRefreshPayload(user, jti));

  await prisma.refreshToken.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      jti,
      tokenHash: hashToken(refreshToken),
      expiresAt: toRefreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function signIn({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(INVALID_CREDENTIALS_MESSAGE);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error(INVALID_CREDENTIALS_MESSAGE);
  }

  return issueSession(user);
}

export async function refreshSession(refreshTokenValue) {
  let payload;

  try {
    payload = verifyRefreshToken(refreshTokenValue);
  } catch {
    throw new Error(INVALID_CREDENTIALS_MESSAGE);
  }

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { jti: payload.jti },
    include: { user: true },
  });

  if (!tokenRecord) {
    throw new Error(INVALID_CREDENTIALS_MESSAGE);
  }

  const isTokenInvalid =
    tokenRecord.revokedAt !== null ||
    tokenRecord.expiresAt <= new Date() ||
    tokenRecord.tokenHash !== hashToken(refreshTokenValue) ||
    tokenRecord.userId !== payload.sub;

  if (isTokenInvalid) {
    throw new Error(INVALID_CREDENTIALS_MESSAGE);
  }

  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revokedAt: new Date() },
  });

  return issueSession(tokenRecord.user);
}

export async function revokeSession(refreshTokenValue) {
  try {
    const payload = verifyRefreshToken(refreshTokenValue);
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });

    if (!tokenRecord) {
      return;
    }

    if (tokenRecord.tokenHash !== hashToken(refreshTokenValue)) {
      return;
    }

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });
  } catch {
    return;
  }
}
