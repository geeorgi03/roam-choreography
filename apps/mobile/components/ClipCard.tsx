import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { theme } from '../lib/theme';
import type { ClipRow } from '../lib/database';

export interface ClipCardProps {
  clip: ClipRow;
  onPress: () => void;
  onLongPress: () => void;
  onRetry?: () => void;
  commentCount?: number;
}

export function ClipCard({ clip, onPress, onLongPress, onRetry, commentCount }: ClipCardProps) {
  const animatedValue = React.useRef(new Animated.Value(1)).current;
  
  const showThumbnail =
    clip.mux_playback_id && clip.upload_status === 'ready';
  const timeStr = clip.recorded_at
    ? new Date(clip.recorded_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const hasText = (v: string | null) => typeof v === 'string' && v.trim().length > 0;
  const tagged =
    hasText(clip.move_name) ||
    hasText(clip.style) ||
    hasText(clip.energy) ||
    hasText(clip.difficulty) ||
    clip.bpm != null ||
    hasText(clip.notes);
  const untagged = !tagged;

  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.row, { transform: [{ scale: animatedValue }] }]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
      <View style={styles.thumbWrap}>
        {clip.clip_type === 'voice_memo' ? (
          <View style={styles.voiceMemoThumb}>
            <Text style={styles.voiceMemoIcon}>🎤</Text>
          </View>
        ) : showThumbnail ? (
          <Image
            source={{
              uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
            }}
            style={styles.thumb}
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbIcon}>▶</Text>
          </View>
        )}
      </View>
      <View style={styles.main}>
        <Text style={styles.label} numberOfLines={1}>
          {clip.label ?? 'Clip'}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.timestamp}>{timeStr}</Text>
          {clip.upload_status === 'local' && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>local</Text>
            </View>
          )}
          {clip.upload_status === 'queued' && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>queued</Text>
            </View>
          )}
          {clip.upload_status === 'uploading' && (
            <View style={styles.pillRow}>
              <ActivityIndicator size="small" color={theme.light.muted} />
              <Text style={styles.pillText}>{clip.upload_progress}%</Text>
            </View>
          )}
          {clip.upload_status === 'processing' && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>processing…</Text>
            </View>
          )}
          {clip.upload_status === 'failed' && (
            <TouchableOpacity
              style={[styles.pill, styles.pillRetry]}
              onPress={onRetry}
            >
              <Text style={styles.pillTextRetry}>⚠ retry</Text>
            </TouchableOpacity>
          )}
          {untagged && (
            <View style={[styles.pill, styles.pillUntagged]}>
              <Text style={styles.pillUntaggedText}>untagged</Text>
            </View>
          )}
          {commentCount != null && commentCount > 0 && (
            <View style={[styles.pill, styles.pillComment]}>
              <Text style={styles.pillCommentText}>💬 {commentCount}</Text>
            </View>
          )}
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing['4'],
    marginVertical: theme.spacing['1.5'],
    paddingVertical: theme.spacing['4'],
    paddingHorizontal: theme.spacing['5'],
    backgroundColor: theme.light.surfaceElevated,
    borderRadius: theme.spacing.radiusXl,
    borderWidth: 1,
    borderColor: theme.light.borderLight,
    ...theme.shadows.sm,
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: theme.spacing.radiusLg,
    overflow: 'hidden',
    marginRight: theme.spacing['4'],
    backgroundColor: theme.light.chromeElevated,
    borderWidth: 1,
    borderColor: theme.light.borderLight,
    ...theme.shadows.glassSm,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: theme.spacing.radiusLg,
  },
  thumbPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: theme.spacing.radiusLg,
    backgroundColor: theme.light.chromeElevated,
    borderWidth: 1,
    borderColor: theme.light.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glassSm,
  },
  thumbIcon: {
    color: theme.light.muted,
    fontSize: 20,
  },
  voiceMemoThumb: {
    width: 88,
    height: 88,
    borderRadius: theme.spacing.radiusLg,
    backgroundColor: theme.light.capture,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.orangeSm,
  },
  voiceMemoIcon: {
    fontSize: 24,
  },
  main: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.displayFamily,
    color: theme.light.active,
    marginBottom: theme.spacing['2'],
    lineHeight: theme.typography.lineHeights.snug,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing['2'],
  },
  timestamp: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.monoFamily,
    color: theme.light.muted,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  pill: {
    paddingHorizontal: theme.spacing['3'],
    paddingVertical: theme.spacing['1.5'],
    borderRadius: theme.spacing.radiusMd,
    backgroundColor: theme.light.chromeElevated,
    borderWidth: 1,
    borderColor: theme.light.borderLight,
    ...theme.shadows.glassSm,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['2'],
    paddingHorizontal: theme.spacing['3'],
    paddingVertical: theme.spacing['1.5'],
    borderRadius: theme.spacing.radiusMd,
    backgroundColor: theme.light.chromeElevated,
    borderWidth: 1,
    borderColor: theme.light.borderLight,
    ...theme.shadows.glassSm,
  },
  pillText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.monoFamily,
    color: theme.light.muted,
    fontWeight: theme.typography.weights.medium,
  },
  pillRetry: {
    backgroundColor: 'transparent',
  },
  pillTextRetry: {
    fontSize: 12,
    color: '#e57373',
  },
  pillUntagged: {
    backgroundColor: theme.light.amberBgLight,
    borderColor: theme.light.amberLight,
  },
  pillUntaggedText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.light.amber,
    fontWeight: theme.typography.weights.semibold,
  },
  pillComment: {
    backgroundColor: theme.light.purpleBg,
    borderColor: theme.light.purple,
    borderWidth: 1,
  },
  pillCommentText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.light.purple,
    fontWeight: theme.typography.weights.semibold,
  },
});
