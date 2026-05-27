import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Text,
} from 'react-native';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { DisplayTitle, MonoCaps } from './ChoreographyPrimitives';
import { useTranslation } from '../../lib/i18n';

type Filter = 'ALL' | 'MINE' | 'REF';

export function ChoreographyLibraryView() {
  const colors = useChoreographyTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { clips, openSheet } = useSessionContext();
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = useMemo(() => {
    if (filter === 'MINE') return clips.filter((c) => c.clip_type !== 'REF');
    if (filter === 'REF') return clips.filter((c) => c.clip_type === 'REF');
    return clips;
  }, [clips, filter]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <DisplayTitle>{t('choreo.library.title')}</DisplayTitle>
        <View style={styles.filters}>
          {(['ALL', 'MINE', 'REF'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <MonoCaps style={filter === f ? { color: colors.active } : undefined}>
                {f === 'ALL'
                  ? t('choreo.library.filterAll')
                  : f === 'MINE'
                    ? t('choreo.library.filterMine')
                    : t('choreo.library.filterRef')}
              </MonoCaps>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.local_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <MonoCaps style={styles.empty}>{t('choreo.library.empty')}</MonoCaps>
        }
        renderItem={({ item }) => {
          const isRef = item.clip_type === 'REF';
          return (
            <Pressable
              style={styles.card}
              onPress={() => openSheet('clip-viewer')}
            >
              <View style={[styles.thumb, isRef && styles.thumbRef]} />
              <View style={styles.cardMeta}>
                <MonoCaps style={{ color: isRef ? colors.ref : colors.primary }}>
                  {isRef ? t('choreo.clip.ref') : t('choreo.clip.mine')}
                </MonoCaps>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.label ?? item.move_name ?? t('choreo.clip.clip')}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.ground },
    header: { padding: 16, paddingBottom: 8 },
    filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.primary,
    },
    list: { padding: 12, paddingBottom: 32 },
    row: { gap: 10 },
    card: {
      flex: 1,
      maxWidth: '48%',
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 10,
    },
    thumb: {
      height: 88,
      backgroundColor: colors.chromeElevated,
    },
    thumbRef: {
      borderBottomWidth: 2,
      borderBottomColor: colors.ref,
    },
    cardMeta: { padding: 10 },
    cardTitle: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '600',
      color: colors.active,
    },
    empty: {
      textAlign: 'center',
      marginTop: 48,
    },
  });
}
