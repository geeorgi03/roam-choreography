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
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const theme_1 = require("../../lib/theme");
const colors = theme_1.theme.light;
const phraseBaseStyle = {
    fontFamily: theme_1.theme.typography.displayFamily,
    fontStyle: 'italic',
    color: colors.muted,
};
function FeelingStrip() {
    const { sessionName, sessionPhrase, updateSessionMeta, openSheet, qualityTarget } = (0, SessionContext_1.useSessionContext)();
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
        await updateSessionMeta({ name: name.trim() || 'Session' });
    };
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.textContent}>
        <react_native_1.View>
          {nameEditing ? (<react_native_1.TextInput style={styles.sessionName} value={name} onChangeText={setName} onBlur={handleNameBlur} autoFocus placeholder='Session name...' placeholderTextColor={colors.muted}/>) : (<react_native_1.TouchableOpacity activeOpacity={0.8} onPress={() => setNameEditing(true)}>
              <react_native_1.Text style={styles.sessionName} numberOfLines={1}>
                {name || 'Session'}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
        <react_native_1.View>
          {phraseEditing ? (<react_native_1.TextInput style={styles.phrase} value={phrase} onChangeText={setPhrase} onBlur={handlePhraseBlur} autoFocus placeholder='add a feeling phrase...' placeholderTextColor={colors.muted}/>) : (<react_native_1.TouchableOpacity activeOpacity={0.8} onPress={() => setPhraseEditing(true)}>
              <react_native_1.Text style={styles.phrase} numberOfLines={1}>
                {phrase || 'add a feeling phrase…'}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
        {qualityTarget && (<react_native_1.View style={styles.qualityTargetRow}>
            <react_native_1.Image style={styles.qualityTargetThumb} source={{ uri: qualityTarget.clip_url }}/>
            <react_native_1.Text style={styles.qualityTargetLabel}>what I'm reaching for</react_native_1.Text>
          </react_native_1.View>)}
      </react_native_1.View>
      <react_native_1.View style={styles.iconRow}>
        <react_native_1.TouchableOpacity style={styles.iconButton} onPress={() => openSheet('share')} activeOpacity={0.8}>
          <react_native_1.Text style={styles.iconText}>↗</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity style={styles.iconButton} onPress={() => { }} activeOpacity={0.8}>
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
});
//# sourceMappingURL=FeelingStrip.js.map