import { API_BASE } from './api';
import {
  getConfiguredSupabaseUrl,
  hostFromUrl,
  probeApiHealth,
  runConnectivityDiagnostics,
} from './connectivityDiagnostics';

export { probeApiHealth, runConnectivityDiagnostics };

export interface RuntimeDiagnosticsSnapshot {
  apiBase: string;
  supabaseHost: string | null;
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
}

export function getRuntimeDiagnosticsSnapshot(): RuntimeDiagnosticsSnapshot {
  const supabaseUrl = getConfiguredSupabaseUrl();
  return {
    apiBase: API_BASE,
    supabaseHost: supabaseUrl ? hostFromUrl(supabaseUrl) : null,
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  };
}
