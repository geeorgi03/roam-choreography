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
exports.TagSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const theme_1 = require("../lib/theme");
const useSession_1 = require("../lib/hooks/useSession");
const database_1 = require("../lib/database");
const api_1 = require("../lib/api");
const TagHistorySheet_1 = require("./TagHistorySheet");
const STYLES = ['Hip-hop', 'Contemporary', 'Ballet', 'Jazz', 'Fusion', 'Other'];
const ENERGY_LEVELS = ['Low', 'Medium', 'High', 'Explosive'];
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
function TagSheet({ clip, bottomSheetRef, onSaved, musicTrackBpm, }) {
    const { session } = (0, useSession_1.useSession)();
    const historySheetRef = (0, react_1.useRef)(null);
    const [moveName, setMoveName] = (0, react_1.useState)('');
    const [style, setStyle] = (0, react_1.useState)(null);
    const [energy, setEnergy] = (0, react_1.useState)(null);
    const [difficulty, setDifficulty] = (0, react_1.useState)(null);
    const [bpm, setBpm] = (0, react_1.useState)('');
    const [notes, setNotes] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (clip) {
            setMoveName(clip.move_name ?? '');
            setStyle(clip.style ?? null);
            setEnergy(clip.energy ?? null);
            setDifficulty(clip.difficulty ?? null);
            setBpm(clip.bpm != null ? String(clip.bpm) : (musicTrackBpm != null ? String(musicTrackBpm) : ''));
            setNotes(clip.notes ?? '');
            setError(null);
        }
    }, [clip, musicTrackBpm]);
    const handleSave = async () => {
        if (!clip?.server_id || !session?.access_token)
            return;
        setError(null);
        setLoading(true);
        try {
            const body = {
                move_name: moveName.trim() || null,
                style,
                energy,
                difficulty,
                bpm: bpm.trim() ? parseInt(bpm, 10) : null,
                notes: notes.trim() || null,
            };
            const res = await fetch(`${api_1.API_BASE}/clips/${clip.server_id}/tags`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error ?? res.statusText);
            const tags = {
                move_name: body.move_name,
                style: body.style,
                energy: body.energy,
                difficulty: body.difficulty,
                bpm: body.bpm,
                notes: body.notes,
            };
            (0, database_1.updateClipTags)(clip.local_id, tags);
            onSaved({ ...clip, ...tags });
            bottomSheetRef.current?.close();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save tags');
        }
        finally {
            setLoading(false);
        }
    };
    if (!clip) {
        return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['80%']} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
        <react_native_1.View style={styles.content}/>
      </bottom_sheet_1.default>);
    }
    return (<>
    <bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['80%']} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={styles.content}>
        <react_native_1.View style={styles.headerRow}>
          <react_native_1.Text style={styles.title}>Edit tags</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={() => historySheetRef.current?.expand()} style={styles.historyBtn}>
            <react_native_1.Text style={styles.historyBtnText}>History</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        <react_native_1.Text style={styles.label}>Move name</react_native_1.Text>
        <react_native_1.TextInput style={styles.input} placeholder="e.g. Shoulder roll into freeze" placeholderTextColor={theme_1.theme.textSecondary} value={moveName} onChangeText={setMoveName} editable={!loading}/>

        <react_native_1.Text style={styles.label}>Style</react_native_1.Text>
        <react_native_1.View style={styles.chipRow}>
          {STYLES.map((s) => (<react_native_1.TouchableOpacity key={s} style={[styles.chip, style === s && styles.chipSelected]} onPress={() => setStyle(s)}>
              <react_native_1.Text style={[styles.chipText, style === s && styles.chipTextSelected]}>{s}</react_native_1.Text>
            </react_native_1.TouchableOpacity>))}
        </react_native_1.View>

        <react_native_1.Text style={styles.label}>Energy</react_native_1.Text>
        <react_native_1.View style={styles.chipRow}>
          {ENERGY_LEVELS.map((e) => (<react_native_1.TouchableOpacity key={e} style={[styles.chip, energy === e && styles.chipSelected]} onPress={() => setEnergy(e)}>
              <react_native_1.Text style={[styles.chipText, energy === e && styles.chipTextSelected]}>{e}</react_native_1.Text>
            </react_native_1.TouchableOpacity>))}
        </react_native_1.View>

        <react_native_1.Text style={styles.label}>Difficulty</react_native_1.Text>
        <react_native_1.View style={styles.chipRow}>
          {DIFFICULTY_LEVELS.map((d) => (<react_native_1.TouchableOpacity key={d} style={[styles.chip, difficulty === d && styles.chipSelected]} onPress={() => setDifficulty(d)}>
              <react_native_1.Text style={[styles.chipText, difficulty === d && styles.chipTextSelected]}>{d}</react_native_1.Text>
            </react_native_1.TouchableOpacity>))}
        </react_native_1.View>

        <react_native_1.Text style={styles.label}>BPM</react_native_1.Text>
        <react_native_1.TextInput style={styles.input} placeholder="BPM" placeholderTextColor={theme_1.theme.textSecondary} value={bpm} onChangeText={setBpm} keyboardType="numeric" editable={!loading}/>

        <react_native_1.Text style={styles.label}>Notes</react_native_1.Text>
        <react_native_1.TextInput style={[styles.input, styles.notesInput]} placeholder="Notes" placeholderTextColor={theme_1.theme.textSecondary} value={notes} onChangeText={setNotes} multiline editable={!loading}/>

        {error ? <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text> : null}

        <react_native_1.TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? (<react_native_1.ActivityIndicator color={theme_1.theme.textPrimary} size="small"/>) : (<react_native_1.Text style={styles.buttonText}>Save</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </bottom_sheet_1.default>
    <TagHistorySheet_1.TagHistorySheet clip={clip} bottomSheetRef={historySheetRef} onRestored={(updatedClip) => {
            setMoveName(updatedClip.move_name ?? '');
            setStyle(updatedClip.style ?? null);
            setEnergy(updatedClip.energy ?? null);
            setDifficulty(updatedClip.difficulty ?? null);
            setBpm(updatedClip.bpm != null ? String(updatedClip.bpm) : '');
            setNotes(updatedClip.notes ?? '');
            onSaved(updatedClip);
        }}/>
  </>);
}
exports.TagSheet = TagSheet;
const styles = react_native_1.StyleSheet.create({
    sheet: {
        backgroundColor: theme_1.theme.background,
    },
    handle: {
        backgroundColor: theme_1.theme.textSecondary,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.theme.textPrimary,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    historyBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
    },
    historyBtnText: {
        color: theme_1.theme.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme_1.theme.textSecondary,
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        backgroundColor: theme_1.theme.light.border,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: theme_1.theme.textPrimary,
    },
    notesInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: theme_1.theme.borderRadius,
        backgroundColor: theme_1.theme.light.border,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
    },
    chipSelected: {
        borderColor: theme_1.theme.untaggedText,
        backgroundColor: theme_1.theme.untaggedBg,
    },
    chipText: {
        fontSize: 14,
        color: theme_1.theme.textPrimary,
    },
    chipTextSelected: {
        color: theme_1.theme.untaggedText,
        fontWeight: '600',
    },
    errorText: {
        color: '#e57373',
        fontSize: 14,
        marginTop: 8,
    },
    button: {
        marginTop: 24,
        backgroundColor: theme_1.theme.accent,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: theme_1.theme.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});
//# sourceMappingURL=TagSheet.js.map