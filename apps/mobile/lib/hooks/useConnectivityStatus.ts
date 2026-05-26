import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  type ConnectivityReport,
  runConnectivityDiagnostics,
} from '../connectivityDiagnostics';

export function useConnectivityStatus(enabled = true) {
  const [report, setReport] = useState<ConnectivityReport | null>(null);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const net = await NetInfo.fetch();
    if (!net.isConnected || net.isInternetReachable === false) {
      setReport({
        issue: 'offline',
        apiHost: '',
        supabaseHost: null,
        apiHealthy: false,
        supabaseReachable: false,
      });
      return;
    }
    setChecking(true);
    try {
      setReport(await runConnectivityDiagnostics());
    } finally {
      setChecking(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
    const sub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        refresh();
      }
    });
    return () => sub();
  }, [refresh]);

  return { report, checking, refresh };
}
