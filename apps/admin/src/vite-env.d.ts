/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_ENV?: string;
  readonly VITE_DATA_MODE?: 'mock' | 'api';
  readonly VITE_MOCK_LATENCY_MS?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SPLASH_ENABLED?: string;
  readonly VITE_SPLASH_MIN_MS?: string;
  readonly VITE_SPLASH_MAX_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
