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
  jwtSecret: readJwtSecret(),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "8h") as SignOptions["expiresIn"],
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  bootstrapAdmin: {
    fullName: process.env.BOOTSTRAP_ADMIN_FULL_NAME ?? "Bootstrap Admin",
    email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@aidn.local",
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "change-me-now"
  },
  mockPersonnelEnabled: process.env.MOCK_PERSONNEL_ENABLED !== "false"
};

function readPort(): number {
  const rawPort = process.env.PORT ?? "4000";
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

function readJwtSecret(): string {
  const jwtSecret = read("JWT_SECRET", "change-me-in-development");

  if (process.env.NODE_ENV === "production" && jwtSecret === "change-me-in-development") {
    throw new Error("JWT_SECRET must be configured in production");
  }

  return jwtSecret;
}
