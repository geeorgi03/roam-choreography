import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useTheme, type ThemePalette } from '../lib/contexts/ThemeContext';
import { useTranslation } from '../lib/i18n';
import { ListRow } from './ListRow';

const spacing = theme.spacing;

export interface NewSessionEntrySheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onBlankSession: () => void;
  onSessionWithReference: () => void;
  onRecordOnly: () => void;
  onBlankSessionOpenCamera: () => void;
}

export function NewSessionEntrySheet({
  bottomSheetRef,
  onBlankSession,
  onSessionWithReference,
  onRecordOnly,
  onBlankSessionOpenCamera,
}: NewSessionEntrySheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={['58%']}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sheetTitle}>{t('home.newProjectSheetTitle')}</Text>
        <Text style={styles.sheetIntro}>{t('home.newProjectSheetIntro')}</Text>

        <ListRow
          recommended
          title={t('home.entryBlankTitle')}
          subtitle={t('home.entryBlankSub')}
          onPress={() => {
            bottomSheetRef.current?.close();
            setTimeout(onBlankSession, 280);
          }}
        />
        <ListRow
          title={t('home.entryReferenceTitle')}
          subtitle={t('home.entryReferenceSub')}
          onPress={() => {
            bottomSheetRef.current?.close();
            setTimeout(onSessionWithReference, 280);
          }}
        />
        <ListRow
          title={t('home.entryRecordOnlyTitle')}
          subtitle={t('home.entryRecordOnlySub')}
          onPress={() => {
            bottomSheetRef.current?.close();
            setTimeout(onRecordOnly, 280);
          }}
        />
        <ListRow
          title={t('home.entryBlankCameraTitle')}
          subtitle={t('home.entryBlankCameraSub')}
          onPress={() => {
            bottomSheetRef.current?.close();
            setTimeout(onBlankSessionOpenCamera, 280);
          }}
        />
      </ScrollView>
    </BottomSheet>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    sheet: {
      backgroundColor: colors.ground,
    },
    handle: {
      backgroundColor: colors.inactive,
    },
    scroll: { flex: 1 },
    scrollInner: {
      paddingHorizontal: 20,
      paddingBottom: 28,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.active,
      marginBottom: 6,
    },
    sheetIntro: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.muted,
      marginBottom: 18,
    },
  });
}
