import { API_BASE } from './api';

export type ConnectivityIssue = 'none' | 'api_unreachable' | 'api_wrong_service' | 'supabase_unreachable' | 'offline';

export interface ConnectivityReport {
  issue: ConnectivityIssue;
  apiHost: string;
  supabaseHost: string | null;
  apiHealthy: boolean;
  supabaseReachable: boolean;
}

export function getConfiguredSupabaseUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  return url || null;
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

async function responseLooksLikeRoamApi(res: Response): Promise<boolean> {
  try {
    const data = (await res.json()) as { name?: string; status?: string };
    return data?.name === 'Roam API' || data?.status === 'ok';
  } catch {
    return false;
  }
}

export async function probeApiHealth(timeoutMs = 12_000): Promise<boolean> {
  const paths = ['/health', '/'] as const;
  for (const path of paths) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
      if (await responseLooksLikeRoamApi(res)) return true;
    } catch {
      // try next path
    } finally {
      clearTimeout(timeoutId);
    }
  }
  return false;
}

/** Supabase exposes GET /auth/v1/health; requires apikey header (401 without it). */
export async function probeSupabaseHealth(
  supabaseUrl = getConfiguredSupabaseUrl(),
  timeoutMs = 10_000
): Promise<boolean> {
  if (!supabaseUrl) return false;
  const base = supabaseUrl.replace(/\/$/, '');
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const headers: Record<string, string> = {};
  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/auth/v1/health`, {
      signal: controller.signal,
      headers,
    });
    if (res.ok) return true;
    // Gateway reachable but missing key — not a dead project.
    if (!anonKey && (res.status === 401 || res.status === 400)) {
      const text = await res.text().catch(() => '');
      return text.toLowerCase().includes('api key') || text.toLowerCase().includes('apikey');
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function runConnectivityDiagnostics(): Promise<ConnectivityReport> {
  const apiHost = hostFromUrl(API_BASE);
  const supabaseUrl = getConfiguredSupabaseUrl();
  const supabaseHost = supabaseUrl ? hostFromUrl(supabaseUrl) : null;

  const [apiHealthy, supabaseReachable] = await Promise.all([
    probeApiHealth(),
    probeSupabaseHealth(supabaseUrl),
  ]);

  let issue: ConnectivityIssue = 'none';
  if (!supabaseReachable && supabaseHost) {
    issue = 'supabase_unreachable';
  } else if (!apiHealthy) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);
    let wrongService = false;
    try {
      const res = await fetch(`${API_BASE}/`, { signal: controller.signal });
      if (res.ok) {
        const text = await res.text();
        wrongService = text.includes('"code":404') || text.includes('Not Found');
      }
    } catch {
      // unreachable
    } finally {
      clearTimeout(timeoutId);
    }
    issue = wrongService ? 'api_wrong_service' : 'api_unreachable';
  }

  return {
    issue,
    apiHost,
    supabaseHost,
    apiHealthy,
    supabaseReachable,
  };
}

export function mapAuthErrorMessage(message: string): string | null {
  const lower = message.toLowerCase();
  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error')
  ) {
    return 'network';
  }
  return null;
}
