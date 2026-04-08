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
exports.VoiceNoteRow = void 0;
const react_1 = __importStar(require("react"));
const expo_av_1 = require("expo-av");
const react_native_1 = require("react-native");
const theme_1 = require("../../lib/theme");
const supabase_1 = require("../../lib/supabase");
const colors = theme_1.theme.light;
async function resolveAudioUri(audioStoragePath) {
    if (audioStoragePath.startsWith('http://') || audioStoragePath.startsWith('https://')) {
        return audioStoragePath;
    }
    if (audioStoragePath.startsWith('file://')) {
        return audioStoragePath;
    }
    if (!supabase_1.supabase)
        return null;
    const { data, error } = await supabase_1.supabase.storage.from('audio').createSignedUrl(audioStoragePath, 3600);
    if (!error && data?.signedUrl)
        return data.signedUrl;
    const publicUrl = supabase_1.supabase.storage.from('audio').getPublicUrl(audioStoragePath).data.publicUrl;
    return publicUrl || null;
}
function VoiceNoteRow({ noteId, audioStoragePath, isActive, onRequestPlay, onPlaybackEnded, }) {
    const soundRef = (0, react_1.useRef)(null);
    const mountedRef = (0, react_1.useRef)(true);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const stopPlayback = (0, react_1.useCallback)(async () => {
        if (!soundRef.current)
            return;
        try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
        }
        catch {
            // ignore playback cleanup failures
        }
        finally {
            soundRef.current = null;
        }
    }, []);
    (0, react_1.useEffect)(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            stopPlayback().catch(() => { });
        };
    }, [stopPlayback]);
    (0, react_1.useEffect)(() => {
        if (!isActive) {
            stopPlayback().catch(() => { });
            return;
        }
        let cancelled = false;
        const start = async () => {
            setIsLoading(true);
            try {
                const uri = await resolveAudioUri(audioStoragePath);
                if (!uri || cancelled || !mountedRef.current)
                    return;
                await stopPlayback();
                const { sound } = await expo_av_1.Audio.Sound.createAsync({ uri }, { shouldPlay: true }, (status) => {
                    if (!status.isLoaded)
                        return;
                    if (status.didJustFinish) {
                        onPlaybackEnded(noteId);
                    }
                });
                if (cancelled || !mountedRef.current) {
                    await sound.unloadAsync();
                    return;
                }
                soundRef.current = sound;
            }
            catch {
                onPlaybackEnded(noteId);
            }
            finally {
                if (!cancelled && mountedRef.current)
                    setIsLoading(false);
            }
        };
        start().catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [audioStoragePath, isActive, noteId, onPlaybackEnded, stopPlayback]);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.TouchableOpacity style={[styles.button, isActive && styles.buttonActive]} activeOpacity={0.8} onPress={() => {
            if (isActive) {
                onPlaybackEnded(noteId);
                return;
            }
            onRequestPlay(noteId);
        }}>
        {isLoading ? (<react_native_1.ActivityIndicator size="small" color={isActive ? '#ffffff' : colors.muted}/>) : (<react_native_1.Text style={[styles.buttonText, isActive && styles.buttonTextActive]}>
            {isActive ? 'Pause' : 'Play'}
          </react_native_1.Text>)}
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
}
exports.VoiceNoteRow = VoiceNoteRow;
const styles = react_native_1.StyleSheet.create({
    container: {
        marginRight: 4,
    },
    button: {
        minWidth: 52,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.chrome,
    },
    buttonActive: {
        borderColor: colors.mine,
        backgroundColor: colors.mine,
    },
    buttonText: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '600',
    },
    buttonTextActive: {
        color: '#ffffff',
    },
});
//# sourceMappingURL=VoiceNoteRow.js.map