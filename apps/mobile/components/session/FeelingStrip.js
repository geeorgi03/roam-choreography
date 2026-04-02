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
function FeelingStrip() {
    const { sessionName, openSheet } = (0, SessionContext_1.useSessionContext)();
    const [phrase, setPhrase] = (0, react_1.useState)('');
    const [phraseEditing, setPhraseEditing] = (0, react_1.useState)(false);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.textContent}>
        <react_native_1.Text style={styles.sessionName} numberOfLines={1}>
          {sessionName}
        </react_native_1.Text>
        <react_native_1.View>
          {phraseEditing ? (<react_native_1.TextInput style={styles.phrase} value={phrase} onChangeText={setPhrase} onBlur={() => setPhraseEditing(false)} autoFocus placeholder="add a feeling phrase..." placeholderTextColor={colors.muted}/>) : (<react_native_1.TouchableOpacity activeOpacity={0.8} onPress={() => setPhraseEditing(true)}>
              <react_native_1.Text style={styles.phrase} numberOfLines={1}>
                {phrase || 'add a feeling phrase…'}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
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
        height: 56,
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
        fontFamily: theme_1.theme.typography.displayFamily,
        fontStyle: 'italic',
        fontSize: 16,
        color: colors.muted,
        marginLeft: 12,
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