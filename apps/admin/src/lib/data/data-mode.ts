import { DATA_MODE, MOCK_LATENCY_MS } from '../../config/app';

export function isMockMode(): boolean {
  return DATA_MODE === 'mock';
}

export async function waitForMockLatency(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, MOCK_LATENCY_MS);
  });
}
