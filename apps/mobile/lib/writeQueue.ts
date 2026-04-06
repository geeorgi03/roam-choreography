import type { MMKV } from 'react-native-mmkv';

export type QueuedWrite = {
  endpoint: string;
  method: string;
  body: string;
  timestamp: number;
};

let writeQueueStorage: MMKV | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV: MMKVClass } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  writeQueueStorage = new MMKVClass({ id: 'write-queue' });
} catch (e) {
  console.error('[writeQueue] MMKV init failed:', e);
}

const WRITE_QUEUE_KEY = 'write_queue';

function getQueue(): QueuedWrite[] {
  if (!writeQueueStorage) return [];
  const raw = writeQueueStorage.getString(WRITE_QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueuedWrite[]) : [];
  } catch {
    return [];
  }
}

function setQueue(queue: QueuedWrite[]): void {
  if (!writeQueueStorage) return;
  writeQueueStorage.set(WRITE_QUEUE_KEY, JSON.stringify(queue));
}

export function isNetworkError(error: unknown): error is TypeError {
  return error instanceof TypeError && error.message.toLowerCase().includes('network');
}

export function enqueueWrite(write: QueuedWrite): void {
  const queue = getQueue();
  queue.push(write);
  setQueue(queue);
}

export function getQueueLength(): number {
  return getQueue().length;
}

export async function drainQueue(accessToken: string): Promise<void> {
  const queue = getQueue().sort((a, b) => a.timestamp - b.timestamp);
  if (queue.length === 0) return;

  const remaining: QueuedWrite[] = [];

  for (let i = 0; i < queue.length; i++) {
    const write = queue[i];
    try {
      await fetch(write.endpoint, {
        method: write.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: write.body,
      });
    } catch (error) {
      if (isNetworkError(error)) {
        remaining.push(write, ...queue.slice(i + 1));
        break;
      }
    }
  }

  setQueue(remaining);
}
