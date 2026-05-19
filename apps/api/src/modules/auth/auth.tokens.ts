import jwt from "jsonwebtoken";
import { existsSync, readFileSync } from "node:fs";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../../shared/config/env.js";
import type { Role } from "../../shared/permissions/permissions.js";

export type SessionTokenPayload = {
  id: string;
  role: Role;
  userType: "internal" | "postulant";
};

type JwtPayload = {
  sub: string;
  userId?: string;
  role: Role;
  userType: "internal" | "postulant";
};

const moduleDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(moduleDir, "../../..");

const looksLikePem = (value: string) => value.startsWith("-----BEGIN ");

const looksLikePath = (value: string) =>
  value.includes("/") ||
  value.includes("\\") ||
  value.endsWith(".pem") ||
  value.endsWith(".b64") ||
  value.endsWith(".key");

const readKeyFile = (value: string): string | undefined => {
  const candidates = [
    isAbsolute(value) ? value : undefined,
    resolve(apiRoot, value),
    resolve(process.cwd(), value),
  ].filter((candidate): candidate is string => Boolean(candidate));

  const keyPath = candidates.find((candidate) => existsSync(candidate));

  if (!keyPath) {
    return undefined;
  }

  return readFileSync(keyPath, "utf8").trim();
};

const decodeBase64Key = (value: string, label: string): string => {
  const decoded = Buffer.from(value.replace(/\s/g, ""), "base64")
    .toString("utf8")
    .trim();

  if (!looksLikePem(decoded)) {
    throw new Error(`${label} must contain a PEM key or base64-encoded PEM key`);
  }

  return decoded;
};

const loadKey = (
  value: string,
  label: string,
  kind: "private" | "public",
): string => {
  const trimmed = value.trim();
  const fileValue = readKeyFile(trimmed);

  if (!fileValue && looksLikePath(trimmed)) {
    throw new Error(`${label} file was not found: ${trimmed}`);
  }

  const raw = fileValue ?? trimmed;
  const pem = looksLikePem(raw) ? raw : decodeBase64Key(raw, label);

  try {
    const key =
      kind === "private" ? createPrivateKey(pem) : createPublicKey(pem);

    if (key.asymmetricKeyType !== "rsa") {
      throw new Error("Not an RSA key");
    }
  } catch {
    throw new Error(`${label} must be a valid RSA ${kind} key for RS256`);
  }

  return pem;
};

const privateKey = loadKey(
  env.jwtPrivateKeyBase64,
  "JWT_PRIVATE_KEY_BASE64",
  "private",
);
const publicKey = loadKey(
  env.jwtPublicKeyBase64,
  "JWT_PUBLIC_KEY_BASE64",
  "public",
);

export const signSessionToken = (user: SessionTokenPayload): string =>
  jwt.sign(
    { userId: user.id, role: user.role, userType: user.userType },
    privateKey,
    {
      algorithm: "RS256",
      subject: user.id,
      expiresIn: env.jwtExpiresIn,
    },
  );

export const verifySessionToken = (token: string): JwtPayload =>
  jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
  }) as JwtPayload;
