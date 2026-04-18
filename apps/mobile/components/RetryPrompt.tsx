import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { theme } from '../lib/theme';

type RetryPromptProps = {
  message: string;
  onRetry: () => void;
  loading?: boolean;
};

export function RetryPrompt({ message, onRetry, loading = false }: RetryPromptProps) {
  const colors = theme.night;
  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.ground }]}>
      <Text style={[styles.message, { color: colors.capture }]}>{message}</Text>
      <TouchableOpacity
        style={[styles.button, { borderColor: colors.mine }, loading && styles.buttonDisabled]}
        onPress={onRetry}
        disabled={loading}
      >
        {loading ? <ActivityIndicator size="small" color={colors.mine} /> : <Text style={[styles.buttonText, { color: colors.mine }]}>Retry</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: theme.spacing.radiusMd,
    padding: 12,
  },
  message: {
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: theme.spacing.radiusSm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
