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
exports.ShareSheet = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const Clipboard = __importStar(require("expo-clipboard"));
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const theme_1 = require("../lib/theme");
const useShare_1 = require("../lib/hooks/useShare");
function ShareSheet({ sessionId, sessionName, hasMusic, untaggedClipCount, bottomSheetRef, onClose, }) {
    const { shareUrl, share, revoke, isShared, loading, error } = (0, useShare_1.useShare)(sessionId);
    const [revoked, setRevoked] = react_1.default.useState(false);
    const handleGenerate = async () => {
        const url = await share();
        if (url) {
            setRevoked(false);
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Link created' });
        }
    };
    const handleCopyLink = async () => {
        const url = shareUrl ?? (await share());
        if (url) {
            setRevoked(false);
            await Clipboard.setStringAsync(url);
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Copied!' });
        }
    };
    const handleShareVia = async () => {
        const url = shareUrl ?? (await share());
        if (!url)
            return;
        setRevoked(false);
        try {
            await react_native_1.Share.share({
                message: url,
                url,
                title: sessionName,
            });
        }
        catch {
            // User cancelled or share not available
        }
    };
    const handleRevoke = async () => {
        const ok = await revoke();
        if (ok) {
            setRevoked(true);
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Link revoked' });
            return;
        }
        setRevoked(false);
        react_native_toast_message_1.default.show({ type: 'error', text1: 'Failed to revoke link' });
    };
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['40%']} enablePanDownToClose onClose={onClose} backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.sessionName}>{sessionName}</react_native_1.Text>

        {!hasMusic && (<react_native_1.View style={[styles.notice, styles.untaggedNotice]}>
            <react_native_1.Text style={styles.untaggedText}>No music added yet</react_native_1.Text>
          </react_native_1.View>)}
        {untaggedClipCount > 0 && (<react_native_1.View style={[styles.notice, styles.untaggedNotice]}>
            <react_native_1.Text style={styles.untaggedText}>
              {untaggedClipCount} clips have no tags yet
            </react_native_1.Text>
          </react_native_1.View>)}

        {error ? <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text> : null}

        {!isShared ? (<react_native_1.TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={loading}>
            {loading ? (<react_native_1.ActivityIndicator color={theme_1.theme.textPrimary} size="small"/>) : (<react_native_1.Text style={styles.buttonText}>Generate link</react_native_1.Text>)}
          </react_native_1.TouchableOpacity>) : (<>
            <react_native_1.TouchableOpacity style={[styles.button, styles.buttonShared]} onPress={handleCopyLink} disabled={loading}>
              {loading ? (<react_native_1.ActivityIndicator color={theme_1.theme.textPrimary} size="small"/>) : (<react_native_1.Text style={styles.buttonText}>🔗 Copy link</react_native_1.Text>)}
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={[styles.button, styles.buttonShared]} onPress={handleShareVia} disabled={loading}>
              <react_native_1.Text style={styles.buttonText}>Share via…</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={[styles.button, styles.revokeButton]} onPress={handleRevoke} disabled={loading}>
              <react_native_1.Text style={styles.revokeButtonText}>Revoke link</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <react_native_1.Text style={styles.sharedHint}>🔗 Link active</react_native_1.Text>
          </>)}

        {revoked && !isShared ? <react_native_1.Text style={styles.revokedHint}>Link revoked</react_native_1.Text> : null}
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.ShareSheet = ShareSheet;
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
    sessionName: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.theme.textPrimary,
        marginBottom: 12,
    },
    notice: {
        padding: 10,
        borderRadius: theme_1.theme.borderRadius,
        marginBottom: 8,
    },
    untaggedNotice: {
        backgroundColor: theme_1.theme.untaggedBg,
    },
    untaggedText: {
        color: theme_1.theme.untaggedText,
        fontSize: 14,
    },
    errorText: {
        color: '#e57373',
        fontSize: 14,
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#222',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: theme_1.theme.borderRadius,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
    },
    buttonShared: {
        borderColor: theme_1.theme.untaggedText,
    },
    buttonText: {
        color: theme_1.theme.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    sharedHint: {
        marginTop: 8,
        color: theme_1.theme.untaggedText,
        fontSize: 12,
    },
    revokedHint: {
        marginTop: 8,
        color: theme_1.theme.textSecondary,
        fontSize: 12,
    },
    revokeButton: {
        backgroundColor: 'transparent',
        borderColor: '#e57373',
    },
    revokeButtonText: {
        color: '#e57373',
        fontSize: 16,
        fontWeight: '600',
    },
});
//# sourceMappingURL=ShareSheet.js.map