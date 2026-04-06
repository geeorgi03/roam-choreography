import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import useLoops from '../../lib/hooks/useLoops';
import { theme } from '../../lib/theme';
import type { Loop } from '@roam/types';

const LOOP_COLOR_PALETTE = ['#e67c5c', '#4a90e2', '#8a6ee8', '#3ba287', '#f2b233', '#d35d9e'];

interface LoopChipRowProps {
  sessionId: string | null;
  sourceUrl: string | null;
  currentPositionMs: number;
  onSeek: (ms: number) => void;
  onActiveLoopChange?: (loop: Loop | null) => void;
}

interface UndoQueueItem {
  loop: Loop;
  timeoutId: ReturnType<typeof setTimeout>;
}

export default function LoopChipRow({
  sessionId,
  sourceUrl,
  currentPositionMs,
  onSeek,
  onActiveLoopChange,
}: LoopChipRowProps) {
  const { loops, isLoading, createLoop, deleteLoop } = useLoops(sessionId, sourceUrl);
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
  const [undoQueue, setUndoQueue] = useState<UndoQueueItem[]>([]);

  const handleChipPress = useCallback(
    (loop: Loop) => {
      setActiveLoopId(loop.id);
      onActiveLoopChange?.(loop);
      onSeek(loop.start_ms);
    },
    [onSeek, onActiveLoopChange]
  );

  const handleAddLoop = useCallback(() => {
    if (!sourceUrl) return;

    // Pick next color from palette
    const nextColor = LOOP_COLOR_PALETTE[loops.length % LOOP_COLOR_PALETTE.length];
    
    // Create 10-second loop at current position
    createLoop(currentPositionMs, currentPositionMs + 10000, nextColor);
  }, [sourceUrl, loops.length, currentPositionMs, createLoop]);

  const handleSwipeDelete = useCallback(
    (loop: Loop) => {
      // Optimistic delete
      deleteLoop(loop.id);

      // Show undo toast
      Toast.show({
        type: 'info',
        text1: 'Loop removed',
        text2: 'Undo',
        visibilityTime: 3000,
        position: 'bottom',
      });

      // Schedule actual delete after timeout
      const timeoutId = setTimeout(() => {
        setUndoQueue((prev) => prev.filter((item) => item.loop.id !== loop.id));
      }, 3000);

      setUndoQueue((prev) => [...prev, { loop, timeoutId }]);
    },
    [deleteLoop]
  );

  const renderChip = useCallback(
    (loop: Loop) => {
      const isActive = loop.id === activeLoopId;
      const chipStyle = [
        styles.chip,
        {
          borderColor: isActive ? loop.color : theme.light.border,
          backgroundColor: isActive ? loop.color + '25' : 'transparent',
        },
      ];
      const textStyle = [
        styles.chipText,
        {
          color: isActive ? loop.color : theme.light.muted,
          fontFamily: theme.typography.monoFamily,
        },
      ];

      return (
        <Swipeable
          key={loop.id}
          onSwipeableOpen={() => handleSwipeDelete(loop)}
          renderRightActions={() => <View style={styles.deleteAction} />}
        >
          <TouchableOpacity
            style={chipStyle}
            onPress={() => handleChipPress(loop)}
            activeOpacity={0.7}
          >
            <Text style={textStyle}>{loop.name}</Text>
          </TouchableOpacity>
        </Swipeable>
      );
    },
    [activeLoopId, handleChipPress, handleSwipeDelete]
  );

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loops.map(renderChip)}
        <TouchableOpacity
          style={[styles.chip, styles.addChip, { borderColor: theme.light.border }]}
          onPress={handleAddLoop}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, { color: theme.light.muted, fontFamily: theme.typography.monoFamily }]}>
            +
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 32,
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    height: 24,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  addChip: {
    minWidth: 32,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '500',
  },
  deleteAction: {
    width: 60,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
