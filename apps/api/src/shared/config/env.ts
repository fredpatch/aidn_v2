import dotenv from "dotenv";
import type { SignOptions } from "jsonwebtoken";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(configDir, "../../..");

dotenv.config({ path: resolve(apiRoot, ".env") });

const read = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readPort(),
  apiPrefix: readApiPrefix(),
  mongodbUri: read("MONGODB_URI", "mongodb://127.0.0.1:27017/aidn"),
  jwtPrivateKeyBase64: read("JWT_PRIVATE_KEY_BASE64"),
  jwtPublicKeyBase64: read("JWT_PUBLIC_KEY_BASE64"),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ??
    "8h") as SignOptions["expiresIn"],
  corsOrigins: readCorsOrigins(),
  authCookieName: process.env.AUTH_COOKIE_NAME ?? "aidn_admin_session",
  portalAuthCookieName:
    process.env.PORTAL_AUTH_COOKIE_NAME ?? "aidn_portal_session",
  authCsrfCookieName: process.env.AUTH_CSRF_COOKIE_NAME ?? "aidn_admin_csrf",
  portalCsrfCookieName:
    process.env.PORTAL_CSRF_COOKIE_NAME ?? "aidn_portal_csrf",
  csrfHeaderName: (
    process.env.CSRF_HEADER_NAME ?? "x-csrf-token"
  ).toLowerCase(),
  publicAccountRequestRateLimitWindowMs: readPositiveInteger(
    "PUBLIC_ACCOUNT_REQUEST_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
  ),
  publicAccountRequestRateLimitMax: readPositiveInteger(
    "PUBLIC_ACCOUNT_REQUEST_RATE_LIMIT_MAX",
    5,
  ),
  publicAccountRequestMinSubmitMs: readPositiveInteger(
    "PUBLIC_ACCOUNT_REQUEST_MIN_SUBMIT_MS",
    3000,
  ),
  uploadStorageDir: process.env.UPLOAD_STORAGE_DIR ?? "./storage",
  portalRequestCourrierMaxFileSizeMb: readPositiveInteger(
    "PORTAL_REQUEST_COURRIER_MAX_FILE_SIZE_MB",
    10,
  ),
  cookieDomain: process.env.COOKIE_DOMAIN ?? "",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: readCookieSameSite(),
  bootstrapAdmin: {
    fullName: process.env.BOOTSTRAP_ADMIN_FULL_NAME ?? "Bootstrap Admin",
    email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@aidn.local",
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "change-me-now",
  },
  officialPersonnelDbEnabled:
    process.env.OFFICIAL_PERSONNEL_DB_ENABLED === "true",
  mockPersonnelEnabled: process.env.MOCK_PERSONNEL_ENABLED !== "false",
  allowDevDataReset: process.env.ALLOW_DEV_DATA_RESET === "true",
};

function readPort(): number {
  const rawPort = process.env.PORT ?? "4400";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT environment variable: ${rawPort}`);
  }

  return port;
}

function readApiPrefix(): string {
  const apiPrefix = process.env.API_PREFIX ?? "/api/v1";

  if (!apiPrefix.startsWith("/")) {
    throw new Error("API_PREFIX must start with /");
  }

  return apiPrefix.replace(/\/$/, "");
}

function readCorsOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ??
    process.env.CORS_ORIGIN ??
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174";

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function readCookieSameSite(): "lax" | "strict" | "none" {
  const sameSite = (process.env.COOKIE_SAME_SITE ?? "lax").toLowerCase();

  if (!["lax", "strict", "none"].includes(sameSite)) {
    throw new Error("COOKIE_SAME_SITE must be one of: lax, strict, none");
  }

  if (
    sameSite === "none" &&
    process.env.NODE_ENV === "production" &&
    process.env.COOKIE_SECURE !== "true"
  ) {
    throw new Error(
      "COOKIE_SECURE must be true in production when COOKIE_SAME_SITE=none",
    );
  }

  return sameSite as "lax" | "strict" | "none";
}

function readPositiveInteger(key: string, fallback: number): number {
  const raw = process.env[key];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return value;
}
