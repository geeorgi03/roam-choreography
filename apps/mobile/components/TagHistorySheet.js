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
exports.TagHistorySheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const theme_1 = require("../lib/theme");
const useSession_1 = require("../lib/hooks/useSession");
const database_1 = require("../lib/database");
const api_1 = require("../lib/api");
const TAG_FIELDS = ['move_name', 'style', 'energy', 'difficulty', 'bpm', 'notes'];
const FIELD_LABELS = {
    move_name: 'Move name',
    style: 'Style',
    energy: 'Energy',
    difficulty: 'Difficulty',
    bpm: 'BPM',
    notes: 'Notes',
};
function formatSavedAt(isoString) {
    const d = new Date(isoString);
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    const dateStr = d.toDateString();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${mins}`;
    if (dateStr === today)
        return `Today, ${time}`;
    if (dateStr === yesterdayStr)
        return `Yesterday, ${time}`;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}, ${time}`;
}
function computeDiff(current, previous) {
    const changed = [];
    let unchangedCount = 0;
    if (previous === null) {
        return { changed, unchangedCount: 0, isBaseline: true };
    }
    for (const field of TAG_FIELDS) {
        const cur = String(current[field] ?? '—');
        const prev = String(previous[field] ?? '—');
        if (cur !== prev) {
            changed.push({ field, oldVal: prev, newVal: cur });
        }
        else {
            unchangedCount++;
        }
    }
    return { changed, unchangedCount, isBaseline: false };
}
function TagHistorySheet({ clip, bottomSheetRef, onRestored, }) {
    const { session } = (0, useSession_1.useSession)();
    const [entries, setEntries] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [restoringId, setRestoringId] = (0, react_1.useState)(null);
    const prevSheetIndexRef = (0, react_1.useRef)(-1);
    const loadSeqRef = (0, react_1.useRef)(0);
    const loadHistory = (0, react_1.useCallback)(async () => {
        if (!clip?.server_id || !session?.access_token) {
            setEntries([]);
            setError(null);
            return;
        }
        const seq = ++loadSeqRef.current;
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${api_1.API_BASE}/clips/${clip.server_id}/tag-history`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            const data = await res.json();
            if (seq !== loadSeqRef.current)
                return;
            if (!res.ok) {
                throw new Error(data.error ?? res.statusText);
            }
            setEntries(data ?? []);
        }
        catch (e) {
            if (seq !== loadSeqRef.current)
                return;
            setError(e instanceof Error ? e.message : 'Failed to load history');
            setEntries([]);
        }
        finally {
            if (seq === loadSeqRef.current)
                setLoading(false);
        }
    }, [clip?.server_id, session?.access_token]);
    (0, react_1.useEffect)(() => {
        if (clip?.server_id && session?.access_token)
            return;
        setEntries([]);
        setError(null);
    }, [clip?.server_id, session?.access_token]);
    const handleRestore = async (entry) => {
        if (!clip?.server_id || !session?.access_token)
            return;
        setRestoringId(entry.id);
        setError(null);
        try {
            const res = await fetch(`${api_1.API_BASE}/clips/${clip.server_id}/tags`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(entry.snapshot),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? res.statusText);
            }
            const snapshot = entry.snapshot;
            (0, database_1.updateClipTags)(clip.local_id, snapshot);
            onRestored({ ...clip, ...snapshot });
            bottomSheetRef.current?.close();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to restore');
        }
        finally {
            setRestoringId(null);
        }
    };
    const isRestoring = restoringId !== null;
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['85%']} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle} onChange={(index) => {
            const prev = prevSheetIndexRef.current;
            prevSheetIndexRef.current = index;
            const wasClosed = prev < 0;
            const isOpen = index >= 0;
            if (wasClosed && isOpen) {
                void loadHistory();
            }
        }}>
      <react_native_1.View style={styles.content}>
        <react_native_1.View style={styles.headerRow}>
          <react_native_1.Text style={styles.title}>Tag History</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={() => bottomSheetRef.current?.close()} style={styles.closeBtn}>
            <react_native_1.Text style={styles.closeBtnText}>Close</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {loading ? (<react_native_1.View style={styles.centered}>
            <react_native_1.ActivityIndicator size="large" color={theme_1.theme.textPrimary}/>
          </react_native_1.View>) : error ? (<react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text>) : (<react_native_1.ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
            {entries.map((entry, index) => {
                const prevSnapshot = index < entries.length - 1
                    ? entries[index + 1].snapshot
                    : null;
                const { changed, unchangedCount, isBaseline } = computeDiff(entry.snapshot, prevSnapshot);
                const isCurrent = index === 0;
                return (<react_native_1.View key={entry.id} style={styles.card}>
                  <react_native_1.View style={styles.metaRow}>
                    <react_native_1.Text style={styles.savedAt}>
                      {formatSavedAt(entry.saved_at)}
                    </react_native_1.Text>
                    {isCurrent && (<react_native_1.View style={styles.currentBadge}>
                        <react_native_1.Text style={styles.currentBadgeText}>Current</react_native_1.Text>
                      </react_native_1.View>)}
                  </react_native_1.View>

                  {changed.length > 0 && (<react_native_1.View style={styles.diffSection}>
                      {changed.map(({ field, oldVal, newVal }) => (<react_native_1.View key={field} style={styles.diffRow}>
                          <react_native_1.Text style={styles.diffLabel}>
                            {FIELD_LABELS[field]}
                          </react_native_1.Text>
                          <react_native_1.View style={styles.diffValues}>
                            <react_native_1.Text style={[
                                styles.diffOld,
                                oldVal === '—' && styles.diffMuted,
                            ]}>
                              {oldVal}
                            </react_native_1.Text>
                            <react_native_1.Text style={styles.diffArrow}> → </react_native_1.Text>
                            <react_native_1.Text style={styles.diffNew}>{newVal}</react_native_1.Text>
                          </react_native_1.View>
                        </react_native_1.View>))}
                    </react_native_1.View>)}

                  {isBaseline && (<react_native_1.Text style={styles.baselineSummary}>
                      Baseline version (first saved tags)
                    </react_native_1.Text>)}

                  {!isBaseline && unchangedCount > 0 && (<react_native_1.Text style={styles.unchangedSummary}>
                      {unchangedCount} field{unchangedCount !== 1 ? 's' : ''}{' '}
                      unchanged
                    </react_native_1.Text>)}

                  {!isCurrent && (<react_native_1.TouchableOpacity style={[
                            styles.restoreBtn,
                            isRestoring && styles.restoreBtnDisabled,
                        ]} onPress={() => handleRestore(entry)} disabled={isRestoring}>
                      {restoringId === entry.id ? (<react_native_1.ActivityIndicator size="small" color={theme_1.theme.textPrimary}/>) : (<react_native_1.Text style={styles.restoreBtnText}>
                          Restore this version
                        </react_native_1.Text>)}
                    </react_native_1.TouchableOpacity>)}
                </react_native_1.View>);
            })}
          </react_native_1.ScrollView>)}
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.TagHistorySheet = TagHistorySheet;
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
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.theme.textPrimary,
    },
    closeBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    closeBtnText: {
        color: theme_1.theme.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#e57373',
        fontSize: 14,
        marginTop: 8,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#222',
        borderRadius: theme_1.theme.borderRadius,
        padding: 16,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    savedAt: {
        fontSize: 14,
        color: theme_1.theme.textSecondary,
        fontWeight: '500',
    },
    currentBadge: {
        backgroundColor: theme_1.theme.textSecondary,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: theme_1.theme.borderRadius,
    },
    currentBadgeText: {
        color: theme_1.theme.background,
        fontSize: 12,
        fontWeight: '600',
    },
    diffSection: {
        marginBottom: 8,
    },
    diffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    diffLabel: {
        fontSize: 13,
        color: theme_1.theme.textSecondary,
        fontWeight: '600',
        minWidth: 80,
    },
    diffValues: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    diffOld: {
        fontSize: 13,
        color: '#ef4444',
        textDecorationLine: 'line-through',
    },
    diffMuted: {
        color: theme_1.theme.textSecondary,
    },
    diffArrow: {
        fontSize: 13,
        color: theme_1.theme.textSecondary,
        marginHorizontal: 4,
    },
    diffNew: {
        fontSize: 13,
        color: '#22c55e',
        fontWeight: '500',
    },
    unchangedSummary: {
        fontSize: 12,
        color: theme_1.theme.textSecondary,
        fontStyle: 'italic',
        marginBottom: 12,
    },
    baselineSummary: {
        fontSize: 12,
        color: theme_1.theme.textSecondary,
        fontStyle: 'italic',
        marginBottom: 12,
    },
    restoreBtn: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        alignItems: 'center',
    },
    restoreBtnDisabled: {
        opacity: 0.6,
    },
    restoreBtnText: {
        color: theme_1.theme.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
});
//# sourceMappingURL=TagHistorySheet.js.map