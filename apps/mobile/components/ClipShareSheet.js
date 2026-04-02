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
exports.ClipShareSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const Clipboard = __importStar(require("expo-clipboard"));
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const theme_1 = require("../lib/theme");
const useClipShare_1 = require("../lib/hooks/useClipShare");
function ClipShareSheet({ clipId, clipLabel, sectionName, duration, bottomSheetRef, }) {
    const snapPoints = (0, react_1.useMemo)(() => ['45%'], []);
    const { shareUrl, share, revoke, isShared, loading, error } = (0, useClipShare_1.useClipShare)(clipId);
    const [copied, setCopied] = (0, react_1.useState)(false);
    const handleGenerate = async () => {
        const url = await share();
        if (url)
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Link created' });
    };
    const handleCopy = async () => {
        const url = shareUrl ?? (await share());
        if (!url)
            return;
        await Clipboard.setStringAsync(url);
        setCopied(true);
        react_native_toast_message_1.default.show({ type: 'success', text1: 'Copied!' });
        setTimeout(() => setCopied(false), 2000);
    };
    const handleView = async () => {
        const url = shareUrl ?? (await share());
        if (!url)
            return;
        try {
            await react_native_1.Linking.openURL(url);
        }
        catch {
            // ignore
        }
    };
    const handleRevoke = async () => {
        const ok = await revoke();
        if (ok)
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Link revoked' });
        else
            react_native_toast_message_1.default.show({ type: 'error', text1: 'Failed to revoke link' });
    };
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.title}>{clipLabel || 'Clip'}</react_native_1.Text>
        <react_native_1.Text style={styles.meta}>
          {sectionName} · {duration}
        </react_native_1.Text>

        {error ? <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text> : null}

        {!isShared ? (<react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={handleGenerate} disabled={loading}>
            {loading ? (<react_native_1.ActivityIndicator color="#0b0b0f" size="small"/>) : (<react_native_1.Text style={styles.primaryBtnText}>Generate link</react_native_1.Text>)}
          </react_native_1.TouchableOpacity>) : (<>
            <react_native_1.View style={styles.urlBox}>
              <react_native_1.Text style={styles.urlText} numberOfLines={2}>
                {shareUrl}
              </react_native_1.Text>
            </react_native_1.View>

            <react_native_1.View style={styles.row}>
              <react_native_1.TouchableOpacity style={styles.secondaryBtn} onPress={handleCopy} disabled={loading}>
                <react_native_1.Text style={styles.secondaryBtnText}>{copied ? 'Copied ✓' : 'Copy'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.secondaryBtn} onPress={handleView} disabled={loading}>
                <react_native_1.Text style={styles.secondaryBtnText}>View</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

            <react_native_1.TouchableOpacity style={styles.revokeBtn} onPress={handleRevoke} disabled={loading}>
              <react_native_1.Text style={styles.revokeBtnText}>Revoke link</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </>)}
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.ClipShareSheet = ClipShareSheet;
const styles = react_native_1.StyleSheet.create({
    sheet: { backgroundColor: theme_1.theme.background },
    handle: { backgroundColor: theme_1.theme.textSecondary },
    content: { padding: 20, paddingBottom: 40, gap: 10 },
    title: { color: theme_1.theme.textPrimary, fontSize: 18, fontWeight: '800' },
    meta: { color: theme_1.theme.textSecondary, fontSize: 13, marginBottom: 4 },
    errorText: { color: '#e57373', fontSize: 13 },
    primaryBtn: {
        backgroundColor: '#C8F135',
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 6,
    },
    primaryBtnText: { color: '#0b0b0f', fontSize: 16, fontWeight: '800' },
    urlBox: {
        backgroundColor: '#1B1B22',
        borderWidth: 1,
        borderColor: '#2A2A32',
        borderRadius: theme_1.theme.borderRadius,
        padding: 12,
    },
    urlText: { color: theme_1.theme.textPrimary, fontSize: 13 },
    row: { flexDirection: 'row', gap: 10 },
    secondaryBtn: {
        flex: 1,
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryBtnText: { color: theme_1.theme.textPrimary, fontSize: 15, fontWeight: '700' },
    revokeBtn: {
        backgroundColor: 'transparent',
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e57373',
        marginTop: 4,
    },
    revokeBtnText: { color: '#e57373', fontSize: 15, fontWeight: '800' },
});
//# sourceMappingURL=ClipShareSheet.js.map