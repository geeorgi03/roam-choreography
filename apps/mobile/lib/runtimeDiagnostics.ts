import { API_BASE } from './api';

export interface RuntimeDiagnosticsSnapshot {
  apiBase: string;
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
}

export function getRuntimeDiagnosticsSnapshot(): RuntimeDiagnosticsSnapshot {
  return {
    apiBase: API_BASE,
    hasSupabaseUrl: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export async function probeApiHealth(timeoutMs = 2500): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

