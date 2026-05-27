import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Platform, ActionSheetIOS, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useInboxCount } from '../../lib/contexts/InboxCountContext';
import { theme } from '../../lib/theme';
import { router } from 'expo-router';
import { API_BASE } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { IconInbox, IconMoreVertical, IconShareOut } from '../icons/SessionChromeIcons';

const colors = theme.light;

/** `clip_url` on the session is the Mux playback id; legacy rows may store an HLS URL. */
function qualityTargetThumbnailUri(
  clipUrl: string,
  timestampMs: number
): string {
  const trimmed = clipUrl.trim();
  const timeSec = Math.max(0, timestampMs / 1000);
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const streamMatch = trimmed.match(/stream\.mux\.com\/([^/?#]+)/i);
    if (streamMatch) {
      const id = streamMatch[1].replace(/\.m3u8$/i, '');
      return `https://image.mux.com/${id}/thumbnail.jpg?time=${timeSec}`;
    }
    return trimmed;
  }
  return `https://image.mux.com/${trimmed}/thumbnail.jpg?time=${timeSec}`;
}

const phraseBaseStyle = {
  fontFamily: theme.typography.bodyFamily,
  fontStyle: 'normal' as const,
  color: colors.muted,
};

export function FeelingStrip() {
  const { t } = useTranslation();
  const { colors: themeColors } = useTheme();
  const { sessionName, sessionPhrase, updateSessionMeta, openSheet, qualityTarget, sessionId, session } =
    useSessionContext();
  const { count } = useInboxCount();
  const [phrase, setPhrase] = useState('');
  const [phraseEditing, setPhraseEditing] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [name, setName] = useState('');

  // Sync with context values
  useEffect(() => {
    setPhrase(sessionPhrase || '');
  }, [sessionPhrase]);

  useEffect(() => {
    setName(sessionName);
  }, [sessionName]);

  const handlePhraseBlur = async () => {
    setPhraseEditing(false);
    await updateSessionMeta({ phrase: phrase.trim() || null });
  };

  const handleNameBlur = async () => {
    setNameEditing(false);
    await updateSessionMeta({ name: name.trim() || t('feelingStrip.sessionNameFallback') });
  };

  const handleExportPdf = async () => {
    if (!session?.access_token) {
      Alert.alert(t('feelingStrip.exportFailedTitle'), t('feelingStrip.exportSignInRequired'));
      return;
    }
    if (!FileSystem.cacheDirectory) {
      Alert.alert(t('feelingStrip.exportFailedTitle'), t('feelingStrip.exportNoCacheDir'));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/export/pdf`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        let message = t('feelingStrip.exportUnable');
        try {
          const err = (await response.json()) as { error?: string };
          if (err?.error) message = err.error;
        } catch {
          // Keep default error message when response is not JSON.
        }
        Alert.alert(t('feelingStrip.exportFailedTitle'), message);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString('base64');
      const filePath = `${FileSystem.cacheDirectory}session-export.pdf`;

      await FileSystem.writeAsStringAsync(filePath, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          t('feelingStrip.exportCompleteTitle'),
          t('feelingStrip.exportSavedAt').replace('{path}', filePath)
        );
        return;
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/pdf',
        dialogTitle: t('feelingStrip.exportDialogTitle'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('feelingStrip.exportUnknownError');
      Alert.alert(t('feelingStrip.exportFailedTitle'), message);
    }
  };

  const handleOverflowMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('feelingStrip.exportPdfAction'), t('feelingStrip.cancelAction')],
          cancelButtonIndex: 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) void handleExportPdf();
        }
      );
      return;
    }

    Alert.alert(t('feelingStrip.moreActionsTitle'), undefined, [
      {
        text: t('feelingStrip.exportPdfAction'),
        onPress: () => {
          void handleExportPdf();
        },
      },
      { text: t('feelingStrip.cancelAction'), style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContent}>
        <View>
          {nameEditing ? (
            <TextInput
              style={styles.sessionName}
              value={name}
              onChangeText={setName}
              onBlur={handleNameBlur}
              autoFocus
              placeholder={t('feelingStrip.sessionNamePlaceholder')}
              placeholderTextColor={colors.muted}
            />
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setNameEditing(true)}>
              <Text style={styles.sessionName} numberOfLines={1}>
                {name || t('feelingStrip.sessionNameFallback')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View>
          {phraseEditing ? (
            <TextInput
              style={styles.phrase}
              value={phrase}
              onChangeText={setPhrase}
              onBlur={handlePhraseBlur}
              autoFocus
              placeholder={t('feelingStrip.phrasePlaceholder')}
              placeholderTextColor={colors.muted}
            />
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setPhraseEditing(true)}>
              <Text style={styles.phrase} numberOfLines={1}>
                {phrase || t('feelingStrip.phraseFallback')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {qualityTarget && (
          <View style={styles.qualityTargetRow}>
            <Image
              style={styles.qualityTargetThumb}
              source={{
                uri: qualityTargetThumbnailUri(qualityTarget.clip_url, qualityTarget.timestamp_ms),
              }}
            />
            <Text style={styles.qualityTargetLabel}>{t('feelingStrip.qualityTargetLabel')}</Text>
          </View>
        )}
      </View>
      <View style={styles.iconRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/(app)/inbox')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('feelingStrip.a11yInbox')}
        >
          <View style={{ position: 'relative' }}>
            <IconInbox size={22} color={themeColors.muted} />
            {count > 0 && (
              <View style={styles.inboxBadge}>
                <Text style={styles.inboxBadgeText}>{count}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => openSheet('share')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('feelingStrip.a11yShare')}
        >
          <IconShareOut size={20} color={themeColors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleOverflowMenu}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('feelingStrip.a11yMore')}
        >
          <IconMoreVertical size={20} color={themeColors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    backgroundColor: colors.amberBg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  textContent: {
    flexShrink: 1,
  },
  sessionName: {
    fontFamily: theme.typography.displayFamily,
    fontSize: 22,
    fontWeight: '500',
    color: colors.active,
  },
  phrase: {
    ...phraseBaseStyle,
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '500',
  },
  qualityTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  qualityTargetThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  qualityTargetLabel: {
    ...phraseBaseStyle,
    fontSize: 12,
  },
  iconRow: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inboxBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.capture,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  inboxBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});