import Constants from 'expo-constants';

const API_URL_STORAGE_KEY = 'roam_api_url_override';

let _mmkv: { getString: (k: string) => string | undefined; set: (k: string, v: string) => void; delete: (k: string) => void } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  _mmkv = new MMKV({ id: 'roam-store' });
} catch {
  // MMKV unavailable — runtime override won't persist
}

function resolveApiBase(): string {
  const override = _mmkv?.getString(API_URL_STORAGE_KEY);
  if (override) return override;

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3001`;
  }

  return 'http://localhost:3001';
}

/** Current API base URL. Changes when setApiBaseOverride is called. */
export let API_BASE = resolveApiBase();

/** Override the API URL at runtime (persisted in MMKV). Pass null to clear. */
export function setApiBaseOverride(url: string | null): void {
  if (url) {
    _mmkv?.set(API_URL_STORAGE_KEY, url);
  } else {
    _mmkv?.delete(API_URL_STORAGE_KEY);
  }
  API_BASE = resolveApiBase();
}

/** Get the current override (null if using default). */
export function getApiBaseOverride(): string | null {
  return _mmkv?.getString(API_URL_STORAGE_KEY) ?? null;
}

export type ApiErrorReason = 'offline' | 'timeout' | 'http' | 'network' | 'unknown';

export class ApiRequestError extends Error {
  readonly reason: ApiErrorReason;
  readonly status?: number;
  readonly bodyText?: string;

  constructor(message: string, opts: { reason: ApiErrorReason; status?: number; bodyText?: string }) {
    super(message);
    this.name = 'ApiRequestError';
    this.reason = opts.reason;
    this.status = opts.status;
    this.bodyText = opts.bodyText;
  }
}

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  shouldRetry?: (ctx: { attempt: number; error: ApiRequestError }) => boolean;
};

function jitteredBackoff(baseDelayMs: number, attempt: number): number {
  const exp = Math.min(5, Math.max(0, attempt - 1));
  const raw = baseDelayMs * 2 ** exp;
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.round(raw * jitter);
}

function mergeAbortSignals(signal?: AbortSignal | null, timeoutMs = 10_000): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }
  }
  return { controller, timeoutId };
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const {
    timeoutMs = 10_000,
    retries = 2,
    retryDelayMs = 300,
    shouldRetry,
    signal,
    ...init
  } = options;

  let lastError: ApiRequestError | null = null;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const { controller, timeoutId } = mergeAbortSignals(signal, timeoutMs);
    try {
      const res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        const httpError = new ApiRequestError(
          `Request failed with status ${res.status}`,
          { reason: 'http', status: res.status, bodyText }
        );
        const canRetry =
          res.status >= 500 ||
          res.status === 408 ||
          res.status === 429;
        if (attempt <= retries && canRetry) {
          await new Promise((resolve) => setTimeout(resolve, jitteredBackoff(retryDelayMs, attempt)));
          continue;
        }
        throw httpError;
      }
      return res;
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      const mapped = error instanceof ApiRequestError
        ? error
        : new ApiRequestError(
            isAbort ? 'Request timed out' : 'Network request failed',
            { reason: isAbort ? 'timeout' : 'network' }
          );
      lastError = mapped;
      const canRetry = shouldRetry ? shouldRetry({ attempt, error: mapped }) : mapped.reason !== 'http';
      if (attempt <= retries && canRetry) {
        await new Promise((resolve) => setTimeout(resolve, jitteredBackoff(retryDelayMs, attempt)));
        continue;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError ?? new ApiRequestError('Unknown request error', { reason: 'unknown' });
}
