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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotePinSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const expo_av_1 = require("expo-av");
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const theme_1 = require("../lib/theme");
const supabase_1 = require("../lib/supabase");
/**
 * Upload a locally-recorded audio file to Supabase Storage so the returned
 * path is stable across devices. Returns the storage path on success, or
 * null when Supabase is unavailable / upload fails (caller falls back to URI).
 */
async function uploadNoteAudio(localUri, sessionId) {
    if (!supabase_1.supabase)
        return null;
    try {
        const { data: { session }, } = await supabase_1.supabase.auth.getSession();
        if (!session?.user?.id)
            return null;
        const noteId = crypto.randomUUID();
        const ext = localUri.split('.').pop()?.toLowerCase() ?? 'm4a';
        const storagePath = `voice-notes/${session.user.id}/${sessionId}/${noteId}.${ext}`;
        const response = await fetch(localUri);
        const blob = await response.blob();
        const { error } = await supabase_1.supabase.storage
            .from('audio')
            .upload(storagePath, blob, { contentType: `audio/${ext}` });
        if (error)
            return null;
        return storagePath;
    }
    catch {
        return null;
    }
}
function NotePinSheet({ bottomSheetRef, sessionId, timecode, sectionName, initialText, initialAudioUri, onSave, onDelete, }) {
    const snapPoints = (0, react_1.useMemo)(() => ['60%'], []);
    const [text, setText] = (0, react_1.useState)(initialText ?? '');
    const [audioUri, setAudioUri] = (0, react_1.useState)(initialAudioUri ?? null);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [recording, setRecording] = (0, react_1.useState)(null);
    const [recordingBusy, setRecordingBusy] = (0, react_1.useState)(false);
    const mountedRef = (0, react_1.useRef)(true);
    react_1.default.useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);
    react_1.default.useEffect(() => {
        setText(initialText ?? '');
        setAudioUri(initialAudioUri ?? null);
    }, [initialText, initialAudioUri, timecode, sectionName]);
    const startRecording = async () => {
        if (recordingBusy || recording)
            return;
        setRecordingBusy(true);
        try {
            await expo_av_1.Audio.requestPermissionsAsync();
            await expo_av_1.Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const r = new expo_av_1.Audio.Recording();
            await r.prepareToRecordAsync(expo_av_1.Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await r.startAsync();
            if (mountedRef.current)
                setRecording(r);
        }
        finally {
            if (mountedRef.current)
                setRecordingBusy(false);
        }
    };
    const stopRecording = async () => {
        if (!recording || recordingBusy)
            return;
        setRecordingBusy(true);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (uri && mountedRef.current)
                setAudioUri(uri);
            if (mountedRef.current)
                setRecording(null);
        }
        finally {
            if (mountedRef.current)
                setRecordingBusy(false);
        }
    };
    const handleSave = async () => {
        const trimmed = text.trim();
        const hasText = trimmed.length > 0;
        const hasAudio = !!audioUri;
        if (!hasText && !hasAudio) {
            react_native_toast_message_1.default.show({ type: 'error', text1: 'Add a note or record audio' });
            return;
        }
        setSaving(true);
        try {
            const payload = {};
            if (hasText)
                payload.text = trimmed;
            if (audioUri) {
                // Upload local recordings to durable storage so audio_storage_path is
                // portable across devices. Falls back to the local URI on failure.
                let finalUri = audioUri;
                if (sessionId && audioUri.startsWith('file://')) {
                    const canonicalPath = await uploadNoteAudio(audioUri, sessionId);
                    if (canonicalPath)
                        finalUri = canonicalPath;
                }
                payload.audioUri = finalUri;
            }
            await onSave(payload);
            bottomSheetRef.current?.close();
        }
        finally {
            setSaving(false);
        }
    };
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.title}>Pin a note</react_native_1.Text>
        <react_native_1.Text style={styles.meta}>
          {sectionName} · {timecode}
        </react_native_1.Text>

        <react_native_1.TextInput style={styles.input} placeholder="Write a note…" placeholderTextColor={theme_1.theme.textSecondary} value={text} onChangeText={setText} multiline/>

        <react_native_1.View style={styles.row}>
          <react_native_1.TouchableOpacity style={[styles.micBtn, recording && styles.micBtnActive]} onPress={recording ? stopRecording : startRecording} disabled={recordingBusy || saving}>
            {recordingBusy ? (<react_native_1.ActivityIndicator color={theme_1.theme.textPrimary} size="small"/>) : (<react_native_1.Text style={styles.micBtnText}>{recording ? 'Stop' : '🎙 Record'}</react_native_1.Text>)}
          </react_native_1.TouchableOpacity>

          {audioUri ? (<react_native_1.TouchableOpacity style={styles.clearBtn} onPress={() => setAudioUri(null)} disabled={saving}>
              <react_native_1.Text style={styles.clearBtnText}>Clear audio</react_native_1.Text>
            </react_native_1.TouchableOpacity>) : null}
        </react_native_1.View>

        <react_native_1.TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? (<react_native_1.ActivityIndicator color={theme_1.theme.textPrimary} size="small"/>) : (<react_native_1.Text style={styles.saveBtnText}>Save</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>

        {onDelete ? (<react_native_1.TouchableOpacity style={styles.deleteBtn} onPress={async () => {
                await onDelete();
                bottomSheetRef.current?.close();
            }} disabled={saving}>
            <react_native_1.Text style={styles.deleteBtnText}>Delete note</react_native_1.Text>
          </react_native_1.TouchableOpacity>) : null}
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.NotePinSheet = NotePinSheet;
const styles = react_native_1.StyleSheet.create({
    sheet: { backgroundColor: theme_1.theme.background },
    handle: { backgroundColor: theme_1.theme.textSecondary },
    content: { padding: 20, paddingBottom: 40, gap: 10 },
    title: { color: theme_1.theme.textPrimary, fontSize: 18, fontWeight: '800' },
    meta: { color: theme_1.theme.textSecondary, fontSize: 13, marginBottom: 4 },
    input: {
        backgroundColor: '#1B1B22',
        borderWidth: 1,
        borderColor: '#2A2A32',
        borderRadius: theme_1.theme.borderRadius,
        padding: 12,
        color: theme_1.theme.textPrimary,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    micBtn: {
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    micBtnActive: { borderColor: '#C8F135' },
    micBtnText: { color: theme_1.theme.textPrimary, fontWeight: '700' },
    clearBtn: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: '#4ECDC4',
        backgroundColor: 'transparent',
    },
    clearBtnText: { color: '#4ECDC4', fontWeight: '700' },
    saveBtn: {
        backgroundColor: '#C8F135',
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: '#0b0b0f', fontSize: 16, fontWeight: '800' },
    deleteBtn: {
        backgroundColor: 'transparent',
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e57373',
        marginTop: 4,
    },
    deleteBtnText: { color: '#e57373', fontWeight: '800' },
});
//# sourceMappingURL=NotePinSheet.js.map