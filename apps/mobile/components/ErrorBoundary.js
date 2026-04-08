"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const theme_1 = require("../lib/theme");
class ErrorBoundary extends react_1.default.Component {
    state = {
        hasError: false,
        error: null,
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }
    handleRestart = () => {
        this.setState({ hasError: false, error: null });
        expo_router_1.router.replace('/');
    };
    render() {
        if (this.state.hasError) {
            return (<react_native_1.View style={styles.container}>
          <react_native_1.Text style={styles.title}>Something went wrong</react_native_1.Text>
          {this.state.error?.message ? (<react_native_1.Text style={styles.message}>{this.state.error.message}</react_native_1.Text>) : null}
          <react_native_1.TouchableOpacity style={styles.button} onPress={this.handleRestart}>
            <react_native_1.Text style={styles.buttonText}>Restart</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>);
        }
        return this.props.children;
    }
}
exports.default = ErrorBoundary;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.theme.light.ground,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme_1.theme.light.active,
        fontFamily: theme_1.theme.typography.displayFamily,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: theme_1.theme.light.muted,
        textAlign: 'center',
        marginBottom: 16,
    },
    button: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: theme_1.theme.light.mine,
        borderRadius: theme_1.theme.borderRadius,
    },
    buttonText: {
        color: theme_1.theme.light.ground,
        fontSize: 16,
        fontWeight: '600',
    },
});
//# sourceMappingURL=ErrorBoundary.js.map