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
exports.AnnotationOverlay = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_gesture_handler_1 = require("react-native-gesture-handler");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const { width: SCREEN_WIDTH } = react_native_1.Dimensions.get('window');
function AnnotationOverlay({ annotations, containerWidth, containerHeight, videoRect, activeTool, onPlaceText, onPlaceArrow, onPlaceCircle, }) {
    const [textModal, setTextModal] = (0, react_1.useState)(null);
    const [textValue, setTextValue] = (0, react_1.useState)('');
    const [arrowStart, setArrowStart] = (0, react_1.useState)(null);
    const [circleStart, setCircleStart] = (0, react_1.useState)(null);
    const [circleRadius, setCircleRadius] = (0, react_1.useState)(0);
    const circleRadiusRef = (0, react_1.useRef)(0);
    const handlePress = (e) => {
        if (videoRect.width <= 0 || videoRect.height <= 0)
            return;
        const x = e.nativeEvent.locationX / videoRect.width;
        const y = e.nativeEvent.locationY / videoRect.height;
        if (activeTool === 'text') {
            setTextModal({ x, y });
            setTextValue('');
        }
        else if (activeTool === 'arrow') {
            if (!arrowStart) {
                setArrowStart({ x, y });
            }
            else {
                onPlaceArrow(arrowStart.x, arrowStart.y, x, y);
                setArrowStart(null);
            }
        }
        else if (activeTool === 'circle') {
            if (!circleStart) {
                setCircleStart({ x, y });
                setCircleRadius(0);
            }
        }
    };
    circleRadiusRef.current = circleRadius;
    const panGesture = react_native_gesture_handler_1.Gesture.Pan()
        .enabled(activeTool === 'circle' && !!circleStart)
        .onUpdate((e) => {
        if (circleStart) {
            const denom = videoRect.width || 1;
            const r = Math.sqrt(e.translationX ** 2 + e.translationY ** 2) / denom;
            circleRadiusRef.current = r;
            setCircleRadius(r);
        }
    })
        .onEnd(() => {
        const r = circleRadiusRef.current;
        if (circleStart && r > 0.01) {
            onPlaceCircle(circleStart.x, circleStart.y, r);
        }
        setCircleStart(null);
        setCircleRadius(0);
    });
    const handleTextSubmit = () => {
        if (textModal && textValue.trim()) {
            onPlaceText(textModal.x, textModal.y, textValue.trim());
            setTextModal(null);
            setTextValue('');
        }
    };
    const arrowSvgShapes = (0, react_1.useMemo)(() => {
        const stroke = '#b8860b';
        const strokeWidth = 2;
        const headLen = 14;
        const headWidth = 9;
        const shapes = [];
        for (const a of annotations) {
            if (a.type !== 'arrow')
                continue;
            const p = a.payload;
            const x1 = p.x1 * videoRect.width;
            const y1 = p.y1 * videoRect.height;
            const x2 = p.x2 * videoRect.width;
            const y2 = p.y2 * videoRect.height;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (!len || len < 2)
                continue;
            const ux = dx / len;
            const uy = dy / len;
            const px = -uy;
            const py = ux;
            const tipX = x2;
            const tipY = y2;
            const baseX = tipX - ux * headLen;
            const baseY = tipY - uy * headLen;
            const leftX = baseX + px * headWidth;
            const leftY = baseY + py * headWidth;
            const rightX = baseX - px * headWidth;
            const rightY = baseY - py * headWidth;
            shapes.push({ kind: 'line', key: `${a.id}-line`, x1, y1, x2, y2 });
            shapes.push({
                kind: 'head',
                key: `${a.id}-head`,
                points: `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`,
            });
        }
        return { shapes, stroke, strokeWidth };
    }, [annotations, videoRect.width, videoRect.height]);
    return (<react_native_gesture_handler_1.GestureDetector gesture={panGesture}>
      <react_native_1.View style={[react_native_1.StyleSheet.absoluteFill, { width: containerWidth, height: containerHeight }]}>
        <react_native_1.View style={[
            styles.videoContentLayer,
            { left: videoRect.x, top: videoRect.y, width: videoRect.width, height: videoRect.height },
        ]}>
          <react_native_svg_1.default width={videoRect.width} height={videoRect.height} style={react_native_1.StyleSheet.absoluteFill} pointerEvents="none">
            {arrowSvgShapes.shapes.map((s) => {
            if (s.kind === 'line') {
                return (<react_native_svg_1.Line key={s.key} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={arrowSvgShapes.stroke} strokeWidth={arrowSvgShapes.strokeWidth}/>);
            }
            return (<react_native_svg_1.Polygon key={s.key} points={s.points} fill={arrowSvgShapes.stroke}/>);
        })}

            {annotations
            .filter((a) => a.type === 'circle')
            .map((a) => {
            const p = a.payload;
            const cx = p.cx * videoRect.width;
            const cy = p.cy * videoRect.height;
            const r = p.r * videoRect.width;
            return (<react_native_svg_1.Circle key={a.id} cx={cx} cy={cy} r={r} stroke="#b8860b" strokeWidth={2} fill="transparent"/>);
        })}

            {circleStart && circleRadius > 0 ? (<react_native_svg_1.Circle cx={circleStart.x * videoRect.width} cy={circleStart.y * videoRect.height} r={circleRadius * videoRect.width} stroke="#b8860b" strokeWidth={2} fill="transparent" strokeDasharray="6 6"/>) : null}
          </react_native_svg_1.default>

          {annotations
            .filter((a) => a.type === 'text')
            .map((a) => {
            const p = a.payload;
            return (<react_native_1.View key={a.id} style={[
                    styles.textLabel,
                    {
                        left: p.x * videoRect.width - 40,
                        top: p.y * videoRect.height - 12,
                    },
                ]}>
                  <react_native_1.Text style={styles.textLabelText} numberOfLines={2}>
                    {p.text}
                  </react_native_1.Text>
                </react_native_1.View>);
        })}

          {arrowStart && (<react_native_1.View style={[
                styles.arrowDot,
                {
                    left: arrowStart.x * videoRect.width - 6,
                    top: arrowStart.y * videoRect.height - 6,
                },
            ]}/>)}

          <react_native_1.TouchableOpacity style={react_native_1.StyleSheet.absoluteFill} onPress={handlePress} activeOpacity={1}/>
        </react_native_1.View>

        <react_native_1.Modal visible={!!textModal} transparent animationType="fade" onRequestClose={() => setTextModal(null)}>
          <react_native_1.TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setTextModal(null)}>
            <react_native_1.View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <react_native_1.TextInput style={styles.textInput} placeholder="Annotation text" placeholderTextColor="#888" value={textValue} onChangeText={setTextValue} autoFocus onSubmitEditing={handleTextSubmit}/>
              <react_native_1.TouchableOpacity style={styles.modalBtn} onPress={handleTextSubmit}>
                <react_native_1.Text style={styles.modalBtnText}>Add</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.TouchableOpacity>
        </react_native_1.Modal>
      </react_native_1.View>
    </react_native_gesture_handler_1.GestureDetector>);
}
exports.AnnotationOverlay = AnnotationOverlay;
const styles = react_native_1.StyleSheet.create({
    videoContentLayer: {
        position: 'absolute',
    },
    textLabel: {
        position: 'absolute',
        maxWidth: 120,
        padding: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 6,
    },
    textLabelText: {
        color: '#fff',
        fontSize: 12,
    },
    arrowDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#b8860b',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 16,
        width: Math.min(SCREEN_WIDTH - 48, 280),
    },
    textInput: {
        backgroundColor: '#333',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        marginBottom: 12,
    },
    modalBtn: {
        backgroundColor: '#b8860b',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    modalBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
//# sourceMappingURL=AnnotationOverlay.js.map