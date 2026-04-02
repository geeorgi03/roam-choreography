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
exports.PaywallSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const WebBrowser = __importStar(require("expo-web-browser"));
const theme_1 = require("../lib/theme");
const useSession_1 = require("../lib/hooks/useSession");
const api_1 = require("../lib/api");
const SUCCESS_URL = 'https://roamdance.com/billing/success';
const PLAN_ROWS = [
    { plan: 'Free', clips: '20 clips', sessions: '3 sessions', music: 'No' },
    { plan: 'Creator', clips: 'Unlimited', sessions: 'Unlimited', music: 'Yes' },
    { plan: 'Pro', clips: 'Unlimited', sessions: 'Unlimited', music: 'Yes' },
];
function PaywallSheet({ bottomSheetRef, onDismiss }) {
    const { session } = (0, useSession_1.useSession)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const handleUpgrade = async () => {
        if (!session?.access_token)
            return;
        setLoading(true);
        try {
            const res = await fetch(`${api_1.API_BASE}/billing/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ plan: 'creator' }),
            });
            const data = (await res.json());
            if (!res.ok)
                throw new Error(data.error ?? 'Checkout failed');
            const url = data.checkout_url;
            if (url)
                await WebBrowser.openAuthSessionAsync(url, SUCCESS_URL);
            bottomSheetRef.current?.close();
            onDismiss?.();
        }
        finally {
            setLoading(false);
        }
    };
    const handleMaybeLater = () => {
        bottomSheetRef.current?.close();
        onDismiss?.();
    };
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['55%']} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.title}>Upgrade to unlock more</react_native_1.Text>

        <react_native_1.View style={styles.table}>
          <react_native_1.View style={styles.tableHeader}>
            <react_native_1.Text style={[styles.cell, styles.headerCell]}>Plan</react_native_1.Text>
            <react_native_1.Text style={[styles.cell, styles.headerCell]}>Clips</react_native_1.Text>
            <react_native_1.Text style={[styles.cell, styles.headerCell]}>Sessions</react_native_1.Text>
            <react_native_1.Text style={[styles.cell, styles.headerCell]}>Music</react_native_1.Text>
          </react_native_1.View>
          {PLAN_ROWS.map((row) => (<react_native_1.View key={row.plan} style={styles.tableRow}>
              <react_native_1.Text style={[styles.cell, styles.cellText]}>{row.plan}</react_native_1.Text>
              <react_native_1.Text style={[styles.cell, styles.cellText]}>{row.clips}</react_native_1.Text>
              <react_native_1.Text style={[styles.cell, styles.cellText]}>{row.sessions}</react_native_1.Text>
              <react_native_1.Text style={[styles.cell, styles.cellText]}>{row.music}</react_native_1.Text>
            </react_native_1.View>))}
        </react_native_1.View>

        <react_native_1.TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpgrade} disabled={loading}>
          {loading ? (<react_native_1.ActivityIndicator color={theme_1.theme.textPrimary} size="small"/>) : (<react_native_1.Text style={styles.buttonText}>Upgrade to Creator — €9/mo</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>

        <react_native_1.TouchableOpacity style={styles.laterLink} onPress={handleMaybeLater}>
          <react_native_1.Text style={styles.laterText}>Maybe later</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.PaywallSheet = PaywallSheet;
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
        textAlign: 'center',
    },
    table: {
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#222',
        borderBottomWidth: 1,
        borderBottomColor: theme_1.theme.textSecondary,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme_1.theme.textSecondary,
    },
    cell: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    headerCell: {
        fontWeight: '700',
        color: theme_1.theme.textPrimary,
        fontSize: 12,
    },
    cellText: {
        color: theme_1.theme.textSecondary,
        fontSize: 12,
    },
    button: {
        backgroundColor: theme_1.theme.accent,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: theme_1.theme.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    laterLink: {
        alignItems: 'center',
    },
    laterText: {
        color: theme_1.theme.textSecondary,
        fontSize: 14,
    },
});
//# sourceMappingURL=PaywallSheet.js.map