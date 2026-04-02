"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTabBar = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const theme_1 = require("../../lib/theme");
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
const tabs = [
    { id: 'workbench', fullLabel: 'Workbench', shortLabel: 'Work' },
    { id: 'song-map', fullLabel: 'Map', shortLabel: 'Map' },
    { id: 'spatial', fullLabel: 'Spatial', shortLabel: 'Space' },
    { id: 'group', fullLabel: 'Group', shortLabel: 'Group' },
];
function SessionTabBar() {
    const { activeTab, setActiveTab, closeSheet } = (0, SessionContext_1.useSessionContext)();
    const { width } = (0, react_native_1.useWindowDimensions)();
    return (<react_native_1.View style={styles.container}>
      {tabs.map((tab) => (<react_native_1.TouchableOpacity key={tab.id} style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
            ]} onPress={() => {
                closeSheet();
                setActiveTab(tab.id);
            }} activeOpacity={0.75}>
          <react_native_1.Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
            ]}>
            {width >= 600 ? tab.fullLabel : tab.shortLabel}
          </react_native_1.Text>
        </react_native_1.TouchableOpacity>))}
    </react_native_1.View>);
}
exports.SessionTabBar = SessionTabBar;
const styles = react_native_1.StyleSheet.create({
    container: {
        height: 36,
        flexDirection: 'row',
        alignItems: 'stretch',
        paddingHorizontal: 12,
        backgroundColor: colors.chrome,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
    },
    tab: {
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: colors.active,
    },
    tabText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '400',
    },
    tabTextActive: {
        color: colors.active,
        fontWeight: '700',
    },
});
//# sourceMappingURL=SessionTabBar.js.map