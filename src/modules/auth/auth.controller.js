import { signInSchema, refreshSchema } from "./auth.validation.js";
import { refreshSession, revokeSession, signIn } from "./auth.service.js";

const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
const REFRESH_COOKIE_NAME = "refresh_token";

function getRefreshCookieOptions() {
  const maxAgeDays = Number(process.env.JWT_REFRESH_DAYS || "30");

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  };
}

function extractCookie(req, key) {
  const raw = req.headers.cookie;
  if (!raw) return null;

  const cookies = raw.split(";").map((item) => item.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === key) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function sendAuthError(res) {
  return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
}

export async function signInHandler(req, res, next) {
  try {
    const parsed = signInSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendAuthError(res);
    }

    const { accessToken, refreshToken } = await signIn(parsed.data);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    return res.status(200).json({ accessToken });
  } catch (error) {
    if (error.message === INVALID_CREDENTIALS_MESSAGE) {
      return sendAuthError(res);
    }
    return next(error);
  }
}

export async function refreshHandler(req, res, next) {
  try {
    const cookieToken = extractCookie(req, REFRESH_COOKIE_NAME);
    const bodyParsed = refreshSchema.safeParse(req.body || {});
    const refreshTokenValue = cookieToken || bodyParsed.data?.refreshToken;

    if (!refreshTokenValue) {
      return sendAuthError(res);
    }

    const { accessToken, refreshToken } = await refreshSession(refreshTokenValue);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    return res.status(200).json({ accessToken });
  } catch (error) {
    if (error.message === INVALID_CREDENTIALS_MESSAGE) {
      return sendAuthError(res);
    }
    return next(error);
  }
}

export async function signOutHandler(req, res) {
  const refreshTokenValue = extractCookie(req, REFRESH_COOKIE_NAME);
  if (refreshTokenValue) {
    await revokeSession(refreshTokenValue);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: "/api/v1/auth",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  return res.status(204).send();
}
