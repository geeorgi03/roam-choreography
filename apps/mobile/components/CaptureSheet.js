"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptureSheet = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const theme_1 = require("../lib/theme");
function CaptureSheet({ bottomSheetRef, onRecord, onInbox, inboxCount = 0, sectionName, }) {
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['35%']} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.title}>
          {sectionName ? `Add to ${sectionName}` : 'Add clip'}
        </react_native_1.Text>
        <react_native_1.View style={styles.cardsRow}>
          <react_native_1.TouchableOpacity style={styles.card} onPress={onRecord} activeOpacity={0.8}>
            <react_native_1.Text style={styles.cardIcon}>📷</react_native_1.Text>
            <react_native_1.Text style={styles.cardTitle}>Record now</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.card} onPress={onInbox} activeOpacity={0.8} disabled={!onInbox}>
            <react_native_1.Text style={styles.cardIcon}>📥</react_native_1.Text>
            <react_native_1.Text style={styles.cardTitle}>Pick from Inbox</react_native_1.Text>
            <react_native_1.Text style={styles.cardSub}>{inboxCount} clips waiting</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.CaptureSheet = CaptureSheet;
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
        color: theme_1.theme.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 12,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    card: {
        flex: 1,
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        padding: 16,
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme_1.theme.textPrimary,
        textAlign: 'center',
    },
    cardSub: {
        marginTop: 6,
        fontSize: 12,
        color: theme_1.theme.textSecondary,
    },
});
//# sourceMappingURL=CaptureSheet.js.map