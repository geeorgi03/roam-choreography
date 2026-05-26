import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

export interface CaptureSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onRecord: () => void;
  onImportVideo?: () => void;
  onInbox?: () => void;
  inboxCount?: number;
  sectionName?: string | null;
}

export function CaptureSheet({
  bottomSheetRef,
  onRecord,
  onImportVideo,
  onInbox,
  inboxCount = 0,
  sectionName,
}: CaptureSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={onImportVideo ? ['42%'] : ['35%']}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {sectionName
            ? t('capture.addToSection').replace('{section}', sectionName)
            : t('capture.addClip')}
        </Text>
        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={styles.card}
            onPress={onRecord}
            activeOpacity={0.8}
          >
            <Text style={styles.cardIcon}>📷</Text>
            <Text style={styles.cardTitle}>{t('capture.recordNow')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={onInbox}
            activeOpacity={0.8}
            disabled={!onInbox}
          >
            <Text style={styles.cardIcon}>📥</Text>
            <Text style={styles.cardTitle}>{t('capture.pickFromInbox')}</Text>
            <Text style={styles.cardSub}>
              {t('capture.clipsWaiting').replace('{count}', String(inboxCount))}
            </Text>
          </TouchableOpacity>
        </View>
        {onImportVideo ? (
          <TouchableOpacity style={styles.importRow} onPress={onImportVideo} activeOpacity={0.85}>
            <Text style={styles.importText}>{t('capture.importMp4')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: theme.background,
  },
  handle: {
    backgroundColor: theme.textSecondary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: theme.light.border,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  cardSub: {
    marginTop: 6,
    fontSize: 12,
    color: theme.textSecondary,
  },
  importRow: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    borderStyle: 'dashed',
  },
  importText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
});
