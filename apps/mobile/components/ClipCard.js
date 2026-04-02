"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipCard = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../lib/theme");
function ClipCard({ clip, onPress, onLongPress, onRetry, commentCount }) {
    const showThumbnail = clip.mux_playback_id && clip.upload_status === 'ready';
    const timeStr = clip.recorded_at
        ? new Date(clip.recorded_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })
        : '';
    const hasText = (v) => typeof v === 'string' && v.trim().length > 0;
    const tagged = hasText(clip.move_name) ||
        hasText(clip.style) ||
        hasText(clip.energy) ||
        hasText(clip.difficulty) ||
        clip.bpm != null ||
        hasText(clip.notes);
    const untagged = !tagged;
    return (<react_native_1.TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8}>
      <react_native_1.View style={styles.thumbWrap}>
        {showThumbnail ? (<react_native_1.Image source={{
                uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
            }} style={styles.thumb}/>) : (<react_native_1.View style={styles.thumbPlaceholder}>
            <react_native_1.Text style={styles.thumbIcon}>▶</react_native_1.Text>
          </react_native_1.View>)}
      </react_native_1.View>
      <react_native_1.View style={styles.main}>
        <react_native_1.Text style={styles.label} numberOfLines={1}>
          {clip.label ?? 'Clip'}
        </react_native_1.Text>
        <react_native_1.View style={styles.meta}>
          <react_native_1.Text style={styles.timestamp}>{timeStr}</react_native_1.Text>
          {clip.upload_status === 'local' && (<react_native_1.View style={styles.pill}>
              <react_native_1.Text style={styles.pillText}>local</react_native_1.Text>
            </react_native_1.View>)}
          {clip.upload_status === 'queued' && (<react_native_1.View style={styles.pill}>
              <react_native_1.Text style={styles.pillText}>queued</react_native_1.Text>
            </react_native_1.View>)}
          {clip.upload_status === 'uploading' && (<react_native_1.View style={styles.pillRow}>
              <react_native_1.ActivityIndicator size="small" color={theme_1.theme.textSecondary}/>
              <react_native_1.Text style={styles.pillText}>{clip.upload_progress}%</react_native_1.Text>
            </react_native_1.View>)}
          {clip.upload_status === 'processing' && (<react_native_1.View style={styles.pill}>
              <react_native_1.Text style={styles.pillText}>processing…</react_native_1.Text>
            </react_native_1.View>)}
          {clip.upload_status === 'failed' && (<react_native_1.TouchableOpacity style={[styles.pill, styles.pillRetry]} onPress={onRetry}>
              <react_native_1.Text style={styles.pillTextRetry}>⚠ retry</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
          {untagged && (<react_native_1.View style={[styles.pill, styles.pillUntagged]}>
              <react_native_1.Text style={styles.pillUntaggedText}>untagged</react_native_1.Text>
            </react_native_1.View>)}
          {commentCount != null && commentCount > 0 && (<react_native_1.View style={[styles.pill, styles.pillComment]}>
              <react_native_1.Text style={styles.pillCommentText}>💬 {commentCount}</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.TouchableOpacity>);
}
exports.ClipCard = ClipCard;
const styles = react_native_1.StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    thumbWrap: {
        width: 56,
        height: 56,
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: 12,
    },
    thumb: {
        width: 56,
        height: 56,
        borderRadius: 6,
    },
    thumbPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 6,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbIcon: {
        color: theme_1.theme.textSecondary,
        fontSize: 20,
    },
    main: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme_1.theme.textPrimary,
        marginBottom: 4,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    timestamp: {
        fontSize: 12,
        color: theme_1.theme.textSecondary,
    },
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#333',
    },
    pillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#333',
    },
    pillText: {
        fontSize: 12,
        color: theme_1.theme.textSecondary,
    },
    pillRetry: {
        backgroundColor: 'transparent',
    },
    pillTextRetry: {
        fontSize: 12,
        color: '#e57373',
    },
    pillUntagged: {
        backgroundColor: theme_1.theme.untaggedBg,
    },
    pillUntaggedText: {
        fontSize: 12,
        color: theme_1.theme.untaggedText,
    },
    pillComment: {
        backgroundColor: 'rgba(184, 134, 11, 0.3)',
    },
    pillCommentText: {
        fontSize: 12,
        color: '#b8860b',
    },
});
//# sourceMappingURL=ClipCard.js.map