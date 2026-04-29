import { APP_NAME } from '@/config/app';

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  if (['false', '0', 'off', 'no'].includes(normalized)) return false;
  if (['true', '1', 'on', 'yes'].includes(normalized)) return true;

  return fallback;
}

function readMilliseconds(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const minDisplayMs = readMilliseconds(import.meta.env.VITE_SPLASH_MIN_MS, 800);
const requestedMaxDisplayMs = readMilliseconds(import.meta.env.VITE_SPLASH_MAX_MS, 2500);

export const splashConfig = {
  enabled: readBoolean(import.meta.env.VITE_SPLASH_ENABLED, true),
  appName: APP_NAME,
  tagline: 'Direction de la Navigabilité',
  subtitle: 'Suivi des dossiers OMA',
  minDisplayMs,
  maxDisplayMs: Math.max(requestedMaxDisplayMs, minDisplayMs + 100),
} as const;
