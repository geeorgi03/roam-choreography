import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useConnectivityStatus } from '../lib/hooks/useConnectivityStatus';
import { useTranslation } from '../lib/i18n';

/** Warns when device is online but API or Supabase backends are misconfigured/unreachable. */
export default function ConnectivityBanner() {
  const { t } = useTranslation();
  const { report, checking, refresh } = useConnectivityStatus(true);

  const message = useMemo(() => {
    if (!report || report.issue === 'none') return null;
    if (report.issue === 'offline') {
      return t('connectivity.offline');
    }
    if (report.issue === 'supabase_unreachable' && report.supabaseHost) {
      return t('connectivity.supabaseDown').replace('{host}', report.supabaseHost);
    }
    if (report.issue === 'api_wrong_service') {
      return t('connectivity.apiWrongService').replace('{host}', report.apiHost);
    }
    if (report.issue === 'api_unreachable') {
      return t('connectivity.apiDown').replace('{host}', report.apiHost);
    }
    return t('connectivity.generic');
  }, [report, t]);

  if (!message) return null;

  return (
    <View style={styles.container}>
      {checking ? (
        <ActivityIndicator size="small" color="#111827" style={styles.spinner} />
      ) : null}
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity onPress={refresh} hitSlop={8}>
        <Text style={styles.retry}>{t('connectivity.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F59E0B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  spinner: { marginRight: 4 },
  text: {
    color: '#111827',
    flex: 1,
    fontWeight: '600',
    fontSize: 12,
  },
  retry: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
