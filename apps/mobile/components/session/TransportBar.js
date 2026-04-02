"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportBar = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const theme_1 = require("../../lib/theme");
const getThemeStyles = () => ({
    container: {
        backgroundColor: theme_1.theme.light.chrome,
        borderTopWidth: 0.5,
        borderTopColor: theme_1.theme.light.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        backgroundColor: theme_1.theme.light.active,
    },
    playButtonText: {
        color: '#ffffff',
        fontFamily: theme_1.theme.typography.monoFamily,
    },
    speedLabel: {
        fontFamily: theme_1.theme.typography.monoFamily,
        color: theme_1.theme.light.muted,
    },
    speedButton: {
        borderColor: theme_1.theme.light.border,
        backgroundColor: theme_1.theme.light.chrome,
    },
    activeSpeedButton: {
        backgroundColor: theme_1.theme.light.active,
        borderColor: theme_1.theme.light.active,
    },
    speedButtonText: {
        fontFamily: theme_1.theme.typography.monoFamily,
        color: theme_1.theme.light.muted,
    },
    activeSpeedButtonText: {
        color: '#ffffff',
    },
});
function TransportBar({ variant }) {
    const { isPlaying, playheadMs, durationMs, playbackSpeed, setPlaybackSpeed, handleSeekBack, handleSeekForward, loopRegion, loopOpenAt, handlePlayPause, handleLoopToggle, handleClearLoop, } = (0, SessionContext_1.useSessionContext)();
    const getLoopButtonStyle = () => {
        if (loopOpenAt !== null) {
            return {
                backgroundColor: '#fff8ee',
                borderColor: '#e8a87c',
                borderLeftColor: '#e8a87c',
            };
        }
        if (loopRegion !== null && loopOpenAt === null) {
            return {
                backgroundColor: '#e1f5ee',
                borderColor: '#7db9a8',
                borderLeftColor: '#7db9a8',
            };
        }
        return {
            backgroundColor: '#e1f5ee',
            borderColor: '#7db9a8',
            borderLeftColor: '#7db9a8',
        };
    };
    const getLoopButtonText = () => {
        if (loopOpenAt !== null) {
            return 'tap to close';
        }
        if (loopRegion !== null && loopOpenAt === null) {
            return 'set loop';
        }
        return 'set loop';
    };
    const getLoopDotColor = () => {
        if (loopOpenAt !== null) {
            return '#e8a87c'; // amber
        }
        if (loopRegion !== null && loopOpenAt === null) {
            return '#7db9a8'; // teal
        }
        return '#7db9a8'; // teal
    };
    const getLoopLabelColor = () => {
        if (loopOpenAt !== null) {
            return '#7a5c2e';
        }
        return '#085041';
    };
    const getLoopDotSize = () => {
        return 9; // 9dp
    };
    const handleLoopButtonPress = () => {
        // "set loop" should always enter loop capture flow; if a loop exists, reset it first.
        if (loopRegion !== null && loopOpenAt === null) {
            handleClearLoop();
        }
        handleLoopToggle();
    };
    if (variant === 'reduced') {
        return (<react_native_1.View style={[styles.container, styles.reducedContainer]}>
        {/* Play button */}
        <react_native_1.TouchableOpacity style={[styles.playButton, styles.reducedPlayButton]} onPress={handlePlayPause}>
          <react_native_1.Text style={styles.playButtonText}>
            {isPlaying ? '⏸' : '▶'}
          </react_native_1.Text>
        </react_native_1.TouchableOpacity>

        <react_native_1.View style={{ flex: 1 }}/>

        {/* Loop button */}
        <react_native_1.TouchableOpacity style={[styles.loopButton, styles.reducedLoopButton, getLoopButtonStyle()]} onPress={handleLoopButtonPress}>
          <react_native_1.View style={[styles.loopDot, {
                    backgroundColor: getLoopDotColor(),
                    width: getLoopDotSize(),
                    height: getLoopDotSize(),
                    borderRadius: getLoopDotSize() / 2,
                }]}/>
          <react_native_1.Text style={[
                styles.loopButtonText,
                styles.reducedLoopButtonText,
                { color: getLoopLabelColor() },
            ]}>
            {getLoopButtonText()}
          </react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, styles.fullContainer]}>
      {/* Seek-back button */}
      <react_native_1.TouchableOpacity style={styles.seekButton} onPress={handleSeekBack}>
        <react_native_1.Text style={{ fontFamily: theme_1.theme.typography.monoFamily, color: theme_1.theme.light.muted }}>
          {'⏮'}
        </react_native_1.Text>
      </react_native_1.TouchableOpacity>

      {/* Play/pause button */}
      <react_native_1.TouchableOpacity style={[styles.playButton, styles.fullPlayButton]} onPress={handlePlayPause}>
        <react_native_1.Text style={styles.playButtonText}>
          {isPlaying ? '⏸' : '▶'}
        </react_native_1.Text>
      </react_native_1.TouchableOpacity>

      {/* Seek-forward button */}
      <react_native_1.TouchableOpacity style={styles.seekButton} onPress={handleSeekForward}>
        <react_native_1.Text style={{ fontFamily: theme_1.theme.typography.monoFamily, color: theme_1.theme.light.muted }}>
          {'⏭'}
        </react_native_1.Text>
      </react_native_1.TouchableOpacity>

      {/* Speed controls */}
      <react_native_1.View style={styles.speedContainer}>
        <react_native_1.Text style={styles.speedLabel}>SPD</react_native_1.Text>
        <react_native_1.View style={styles.speedButtons}>
          {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (<react_native_1.TouchableOpacity key={speed} style={[
                styles.speedButton,
                playbackSpeed === speed && styles.activeSpeedButton,
            ]} onPress={() => setPlaybackSpeed(speed)}>
              <react_native_1.Text style={[
                styles.speedButtonText,
                playbackSpeed === speed && styles.activeSpeedButtonText,
            ]}>
                {speed}×
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>))}
        </react_native_1.View>
      </react_native_1.View>

      {/* Loop button */}
      <react_native_1.TouchableOpacity style={[styles.loopButton, styles.fullLoopButton, getLoopButtonStyle()]} onPress={handleLoopButtonPress}>
        <react_native_1.View style={[styles.loopDot, {
                backgroundColor: getLoopDotColor(),
                width: getLoopDotSize(),
                height: getLoopDotSize(),
                borderRadius: getLoopDotSize() / 2,
            }]}/>
        <react_native_1.Text style={[
            styles.loopButtonText,
            styles.fullLoopButtonText,
            { color: getLoopLabelColor() },
        ]}>
          {getLoopButtonText()}
        </react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
}
exports.TransportBar = TransportBar;
const styles = react_native_1.StyleSheet.create({
    container: {
        height: 52,
        backgroundColor: '#ffffff',
        borderTopWidth: 0.5,
        borderTopColor: '#e8e3dc',
        flexDirection: 'row',
        alignItems: 'center',
    },
    fullContainer: {
        paddingHorizontal: 8,
        gap: 8,
    },
    reducedContainer: {
        paddingHorizontal: 12,
        gap: 8,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3a342d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullPlayButton: {
        width: 36,
        height: 36,
    },
    reducedPlayButton: {
        width: 36,
        height: 36,
    },
    playButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    speedContainer: {
        flex: 1,
        alignItems: 'center',
    },
    speedLabel: {
        fontSize: 9,
        fontFamily: theme_1.theme.typography.monoFamily,
        color: '#8a8278',
        marginBottom: 2,
    },
    speedButtons: {
        flexDirection: 'row',
        gap: 3,
    },
    speedButton: {
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e8e3dc',
        backgroundColor: '#ffffff',
    },
    activeSpeedButton: {
        backgroundColor: '#3a342d',
        borderColor: '#3a342d',
    },
    speedButtonText: {
        fontSize: 9,
        fontFamily: theme_1.theme.typography.monoFamily,
        color: '#8a8278',
    },
    activeSpeedButtonText: {
        color: '#ffffff',
    },
    loopButton: {
        width: 110,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderLeftWidth: 0.5,
    },
    fullLoopButton: {
        width: 110,
    },
    reducedLoopButton: {},
    loopDot: {
        borderRadius: 4.5,
    },
    loopButtonText: {
        fontSize: 11,
        fontFamily: theme_1.theme.typography.monoFamily,
    },
    fullLoopButtonText: {
        fontSize: 11,
    },
    reducedLoopButtonText: {
        fontSize: 9,
    },
    seekButton: {
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme_1.theme.light.border,
        backgroundColor: theme_1.theme.light.chrome,
    },
});
//# sourceMappingURL=TransportBar.js.map