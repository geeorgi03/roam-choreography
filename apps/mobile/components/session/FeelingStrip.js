"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeelingStrip = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const FileSystem = __importStar(require("expo-file-system"));
const Sharing = __importStar(require("expo-sharing"));
const buffer_1 = require("buffer");
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const InboxCountContext_1 = require("../../lib/contexts/InboxCountContext");
const theme_1 = require("../../lib/theme");
const expo_router_1 = require("expo-router");
const api_1 = require("../../lib/api");
const i18n_1 = require("../../lib/i18n");
const colors = theme_1.theme.light;
/** `clip_url` on the session is the Mux playback id; legacy rows may store an HLS URL. */
function qualityTargetThumbnailUri(clipUrl, timestampMs) {
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
    fontFamily: theme_1.theme.typography.displayFamily,
    fontStyle: 'italic',
    color: colors.muted,
};
function FeelingStrip() {
    const { t } = (0, i18n_1.useTranslation)();
    const { sessionName, sessionPhrase, updateSessionMeta, openSheet, qualityTarget, sessionId, session } = (0, SessionContext_1.useSessionContext)();
    const { count } = (0, InboxCountContext_1.useInboxCount)();
    const [phrase, setPhrase] = (0, react_1.useState)('');
    const [phraseEditing, setPhraseEditing] = (0, react_1.useState)(false);
    const [nameEditing, setNameEditing] = (0, react_1.useState)(false);
    const [name, setName] = (0, react_1.useState)('');
    // Sync with context values
    (0, react_1.useEffect)(() => {
        setPhrase(sessionPhrase || '');
    }, [sessionPhrase]);
    (0, react_1.useEffect)(() => {
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
            react_native_1.Alert.alert('Export failed', 'You need to be signed in to export this PDF.');
            return;
        }
        if (!FileSystem.cacheDirectory) {
            react_native_1.Alert.alert('Export failed', 'No cache directory available on this device.');
            return;
        }
        try {
            const response = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/export/pdf`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!response.ok) {
                let message = 'Unable to export PDF.';
                try {
                    const err = (await response.json());
                    if (err?.error)
                        message = err.error;
                }
                catch {
                    // Keep default error message when response is not JSON.
                }
                react_native_1.Alert.alert('Export failed', message);
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const base64String = buffer_1.Buffer.from(arrayBuffer).toString('base64');
            const filePath = `${FileSystem.cacheDirectory}session-export.pdf`;
            await FileSystem.writeAsStringAsync(filePath, base64String, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) {
                react_native_1.Alert.alert('Export complete', `PDF saved at ${filePath}`);
                return;
            }
            await Sharing.shareAsync(filePath, {
                mimeType: 'application/pdf',
                dialogTitle: 'Export Session PDF',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            react_native_1.Alert.alert('Export failed', message);
        }
    };
    const handleOverflowMenu = () => {
        if (react_native_1.Platform.OS === 'ios') {
            react_native_1.ActionSheetIOS.showActionSheetWithOptions({
                options: ['Export PDF', 'Cancel'],
                cancelButtonIndex: 1,
            }, (buttonIndex) => {
                if (buttonIndex === 0)
                    void handleExportPdf();
            });
            return;
        }
        react_native_1.Alert.alert('More actions', undefined, [
            {
                text: 'Export PDF',
                onPress: () => {
                    void handleExportPdf();
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.textContent}>
        <react_native_1.View>
          {nameEditing ? (<react_native_1.TextInput style={styles.sessionName} value={name} onChangeText={setName} onBlur={handleNameBlur} autoFocus placeholder={t('feelingStrip.sessionNamePlaceholder')} placeholderTextColor={colors.muted}/>) : (<react_native_1.TouchableOpacity activeOpacity={0.8} onPress={() => setNameEditing(true)}>
              <react_native_1.Text style={styles.sessionName} numberOfLines={1}>
                {name || t('feelingStrip.sessionNameFallback')}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
        <react_native_1.View>
          {phraseEditing ? (<react_native_1.TextInput style={styles.phrase} value={phrase} onChangeText={setPhrase} onBlur={handlePhraseBlur} autoFocus placeholder={t('feelingStrip.phrasePlaceholder')} placeholderTextColor={colors.muted}/>) : (<react_native_1.TouchableOpacity activeOpacity={0.8} onPress={() => setPhraseEditing(true)}>
              <react_native_1.Text style={styles.phrase} numberOfLines={1}>
                {phrase || t('feelingStrip.phraseFallback')}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
        {qualityTarget && (<react_native_1.View style={styles.qualityTargetRow}>
            <react_native_1.Image style={styles.qualityTargetThumb} source={{
                uri: qualityTargetThumbnailUri(qualityTarget.clip_url, qualityTarget.timestamp_ms),
            }}/>
            <react_native_1.Text style={styles.qualityTargetLabel}>{t('feelingStrip.qualityTargetLabel')}</react_native_1.Text>
          </react_native_1.View>)}
      </react_native_1.View>
      <react_native_1.View style={styles.iconRow}>
        <react_native_1.TouchableOpacity style={styles.iconButton} onPress={() => expo_router_1.router.push('/(app)/inbox')} activeOpacity={0.8}>
          <react_native_1.View style={{ position: 'relative' }}>
            <react_native_1.Text style={styles.iconText}>🔔</react_native_1.Text>
            {count > 0 && (<react_native_1.View style={styles.inboxBadge}>
                <react_native_1.Text style={styles.inboxBadgeText}>{count}</react_native_1.Text>
              </react_native_1.View>)}
          </react_native_1.View>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity style={styles.iconButton} onPress={() => openSheet('share')} activeOpacity={0.8}>
          <react_native_1.Text style={styles.iconText}>↗</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity style={styles.iconButton} onPress={handleOverflowMenu} activeOpacity={0.8}>
          <react_native_1.Text style={styles.iconText}>⋮</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.View>);
}
exports.FeelingStrip = FeelingStrip;
const styles = react_native_1.StyleSheet.create({
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
        fontFamily: theme_1.theme.typography.displayFamily,
        fontSize: 22,
        fontWeight: '500',
        color: colors.active,
    },
    phrase: {
        ...phraseBaseStyle,
        fontSize: 16,
        marginLeft: 12,
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
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 14,
        color: colors.muted,
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
//# sourceMappingURL=FeelingStrip.js.map