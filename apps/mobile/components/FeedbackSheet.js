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
exports.FeedbackSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const theme_1 = require("../lib/theme");
const useSession_1 = require("../lib/hooks/useSession");
const api_1 = require("../lib/api");
const steps = [
    { key: 'statement', label: 'Statement', placeholder: 'What stayed with you?' },
    { key: 'questions', label: 'Questions', placeholder: 'What questions does this raise?' },
    { key: 'observations', label: 'Observations', placeholder: 'What did you observe?' },
    { key: 'opinions', label: 'Opinions', placeholder: 'What is your opinion?' },
];
exports.FeedbackSheet = react_1.default.forwardRef(function FeedbackSheet({ bottomSheetRef, sessionId, clipId, onClose }, ref) {
    const { session } = (0, useSession_1.useSession)();
    const [step, setStep] = (0, react_1.useState)(0);
    const [statement, setStatement] = (0, react_1.useState)('');
    const [questions, setQuestions] = (0, react_1.useState)('');
    const [observations, setObservations] = (0, react_1.useState)('');
    const [opinions, setOpinions] = (0, react_1.useState)('');
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const current = steps[step];
    const currentValue = current.key === 'statement'
        ? statement
        : current.key === 'questions'
            ? questions
            : current.key === 'observations'
                ? observations
                : opinions;
    const setCurrentValue = (value) => {
        if (current.key === 'statement')
            setStatement(value);
        else if (current.key === 'questions')
            setQuestions(value);
        else if (current.key === 'observations')
            setObservations(value);
        else
            setOpinions(value);
    };
    const reset = (0, react_1.useCallback)(() => {
        setStep(0);
        setStatement('');
        setQuestions('');
        setObservations('');
        setOpinions('');
        setIsSubmitting(false);
    }, []);
    (0, react_1.useEffect)(() => {
        reset();
    }, [clipId, reset]);
    (0, react_1.useImperativeHandle)(ref, () => ({
        reset,
    }), [reset]);
    const handleClose = (0, react_1.useCallback)(() => {
        reset();
        onClose();
    }, [onClose, reset]);
    const handleSubmit = async () => {
        if (!session?.access_token || !clipId) {
            react_native_1.Alert.alert('Submit failed', 'Clip is not ready to receive feedback yet.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/clips/${clipId}/feedback`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    statement,
                    questions,
                    observations,
                    opinions,
                }),
            });
            if (!res.ok) {
                const message = await res.text();
                throw new Error(message || `HTTP ${res.status}`);
            }
            handleClose();
            bottomSheetRef.current?.close();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            react_native_1.Alert.alert('Submit failed', message);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['70%', '90%']} enablePanDownToClose onClose={handleClose} backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={styles.content}>
        <react_native_1.View style={styles.stepRow}>
          {steps.map((item, idx) => {
            const isActive = idx === step;
            return (<react_native_1.View key={item.key} style={[styles.stepPill, isActive ? styles.stepPillActive : styles.stepPillInactive]}>
                <react_native_1.Text style={[styles.stepPillText, isActive ? styles.stepPillTextActive : styles.stepPillTextInactive]}>
                  {idx + 1}
                </react_native_1.Text>
              </react_native_1.View>);
        })}
        </react_native_1.View>

        <react_native_1.Text style={styles.stepLabel}>{current.label}</react_native_1.Text>

        <react_native_1.TextInput style={styles.input} multiline value={currentValue} onChangeText={setCurrentValue} placeholder={current.placeholder} placeholderTextColor={theme_1.theme.light.muted} textAlignVertical="top" editable={!isSubmitting}/>

        {step < 3 ? (<react_native_1.TouchableOpacity style={styles.nextButton} onPress={() => setStep((prev) => (prev + 1))}>
            <react_native_1.Text style={styles.nextButtonText}>Next →</react_native_1.Text>
          </react_native_1.TouchableOpacity>) : (<react_native_1.TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (<react_native_1.ActivityIndicator color="#FFFFFF" size="small"/>) : (<react_native_1.Text style={styles.submitButtonText}>Submit</react_native_1.Text>)}
          </react_native_1.TouchableOpacity>)}
      </react_native_1.View>
    </bottom_sheet_1.default>);
});
const styles = react_native_1.StyleSheet.create({
    sheet: {
        backgroundColor: theme_1.theme.light.ground,
    },
    handle: {
        backgroundColor: theme_1.theme.light.inactive,
    },
    content: {
        padding: 20,
        gap: 14,
    },
    stepRow: {
        flexDirection: 'row',
        gap: 8,
    },
    stepPill: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepPillActive: {
        backgroundColor: theme_1.theme.light.mine,
    },
    stepPillInactive: {
        backgroundColor: theme_1.theme.light.border,
    },
    stepPillText: {
        fontSize: 14,
        fontWeight: '700',
    },
    stepPillTextActive: {
        color: '#FFFFFF',
    },
    stepPillTextInactive: {
        color: theme_1.theme.light.muted,
    },
    stepLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.theme.light.active,
    },
    input: {
        minHeight: 120,
        backgroundColor: theme_1.theme.light.chrome,
        borderWidth: 1,
        borderColor: theme_1.theme.light.border,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        paddingHorizontal: 16,
        color: theme_1.theme.light.active,
        fontSize: 15,
    },
    nextButton: {
        backgroundColor: theme_1.theme.light.mine,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: theme_1.theme.light.amber,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
//# sourceMappingURL=FeedbackSheet.js.map