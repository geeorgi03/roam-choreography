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
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const DocumentPicker = __importStar(require("expo-document-picker"));
const theme_1 = require("../../../lib/theme");
const useSession_1 = require("../../../lib/hooks/useSession");
const useMusicTrackStatus_1 = require("../../../lib/hooks/useMusicTrackStatus");
const PaywallSheet_1 = require("../../../components/PaywallSheet");
const react_1 = require("react");
const api_1 = require("../../../lib/api");
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
function MusicSetupScreen() {
    const { id: sessionId } = (0, expo_router_1.useLocalSearchParams)();
    const router = (0, expo_router_1.useRouter)();
    const { session } = (0, useSession_1.useSession)();
    const { refetch } = (0, useMusicTrackStatus_1.useMusicTrackStatus)(sessionId ?? null);
    const [youtubeUrl, setYoutubeUrl] = (0, react_1.useState)('');
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const paywallSheetRef = (0, react_1.useRef)(null);
    const handleUpload = async () => {
        if (!sessionId || !session?.access_token)
            return;
        setError(null);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['audio/mpeg', 'audio/wav', 'audio/aac'],
            });
            if (result.canceled)
                return;
            const file = result.assets[0];
            setUploading(true);
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType ?? 'audio/mpeg',
            });
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/music`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` },
                body: formData,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (res.status === 403 && data.error === 'plan_limit_reached') {
                    paywallSheetRef.current?.snapToIndex(0);
                    return;
                }
                throw new Error(data.error ?? res.statusText);
            }
            // Return immediately to the session workspace; analysis status renders there.
            router.replace({ pathname: './[id]', params: { id: sessionId } });
            void refetch();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed');
        }
        finally {
            setUploading(false);
        }
    };
    const handleYoutubeValidate = async () => {
        if (!sessionId || !session?.access_token)
            return;
        const url = youtubeUrl.trim();
        if (!YOUTUBE_URL_REGEX.test(url)) {
            setError('Please enter a valid YouTube URL (youtube.com/watch or youtu.be/)');
            return;
        }
        setError(null);
        try {
            setUploading(true);
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/music`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ youtube_url: url }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (res.status === 403 && data.error === 'plan_limit_reached') {
                    paywallSheetRef.current?.snapToIndex(0);
                    return;
                }
                throw new Error(data.error ?? res.statusText);
            }
            const data = (await res.json());
            router.replace({
                pathname: './youtube-player',
                params: { sessionId, musicTrackId: data.music_track_id },
            });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Request failed');
        }
        finally {
            setUploading(false);
        }
    };
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.title}>Set Up Music</react_native_1.Text>

      <react_native_1.View style={styles.cardsRow}>
        <react_native_1.TouchableOpacity style={[styles.card, uploading && styles.cardDisabled]} onPress={handleUpload} disabled={uploading} activeOpacity={0.8}>
          <react_native_1.Text style={styles.cardIcon}>📁</react_native_1.Text>
          <react_native_1.Text style={styles.cardTitle}>Upload</react_native_1.Text>
          <react_native_1.Text style={styles.cardSub}>audio file</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.View style={styles.card}>
          <react_native_1.Text style={styles.cardIcon}>🔗</react_native_1.Text>
          <react_native_1.Text style={styles.cardTitle}>YouTube Link</react_native_1.Text>
          <react_native_1.Text style={styles.cardSub}/>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={styles.youtubeRow}>
        <react_native_1.TextInput style={styles.input} placeholder="Paste YouTube URL…" placeholderTextColor={theme_1.theme.textSecondary} value={youtubeUrl} onChangeText={setYoutubeUrl} autoCapitalize="none" editable={!uploading}/>
        <react_native_1.TouchableOpacity style={[styles.validateBtn, uploading && styles.buttonDisabled]} onPress={handleYoutubeValidate} disabled={uploading} activeOpacity={0.8}>
          <react_native_1.Text style={styles.validateBtnText}>Validate</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      {error ? <react_native_1.Text style={styles.error}>{error}</react_native_1.Text> : null}

      <PaywallSheet_1.PaywallSheet bottomSheetRef={paywallSheetRef}/>
    </react_native_1.View>);
}
exports.default = MusicSetupScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.theme.background,
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: theme_1.theme.textPrimary,
        marginBottom: 16,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    card: {
        flex: 1,
        backgroundColor: theme_1.theme.background,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        padding: 16,
        alignItems: 'center',
    },
    cardDisabled: {
        opacity: 0.6,
    },
    cardIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme_1.theme.textPrimary,
    },
    cardSub: {
        fontSize: 12,
        color: theme_1.theme.textSecondary,
    },
    youtubeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingHorizontal: 12,
        color: theme_1.theme.textPrimary,
    },
    validateBtn: {
        paddingHorizontal: 16,
        height: 44,
        justifyContent: 'center',
        backgroundColor: theme_1.theme.accent,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    validateBtnText: {
        color: theme_1.theme.textPrimary,
        fontWeight: '600',
    },
    error: {
        color: '#e74c3c',
        fontSize: 14,
        marginBottom: 8,
    },
});
//# sourceMappingURL=music-setup.js.map