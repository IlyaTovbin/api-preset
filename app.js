import "./env.js";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { prisma } from "./src/lib/prisma.js";
import { v1Router } from "./src/routes/v1.js";

const app = express();

function parseBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getCorsOrigins() {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const corsOrigins = getCorsOrigins();
const trustProxy = parseBoolean(process.env.TRUST_PROXY, false);
const jsonLimit = process.env.JSON_LIMIT || "100kb";
const urlEncodedLimit = process.env.URL_ENCODED_LIMIT || "100kb";

app.set("trust proxy", trustProxy);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsOrigins.length === 0) return callback(null, false);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
  }),
);

app.use(express.json({ limit: jsonLimit }));
app.use(
  express.urlencoded({
    extended: false,
    limit: urlEncodedLimit,
    parameterLimit: parseNumber(process.env.URL_ENCODED_PARAMETER_LIMIT, 100),
  }),
);

app.get("/health", async (req, res) => {
  const basePayload = {
    server: "up",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      ...basePayload,
      database: "up",
    });
  } catch (error) {
    return res.status(503).json({
      ...basePayload,
      server: "degraded",
      database: "down",
      error: "Database connection failed",
    });
  }
});

app.use("/api/v1", v1Router);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export { app };
