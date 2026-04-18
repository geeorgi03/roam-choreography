import React, { useCallback, useEffect, useImperativeHandle, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { ApiRequestError, apiRequest } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { RetryPrompt } from './RetryPrompt';

export interface FeedbackSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  sessionId: string;
  clipId: string;
  onClose: () => void;
}

export interface FeedbackSheetHandle {
  reset: () => void;
}

type StepKey = 'statement' | 'questions' | 'observations' | 'opinions';
type StepIndex = 0 | 1 | 2 | 3;

export const FeedbackSheet = React.forwardRef<FeedbackSheetHandle, FeedbackSheetProps>(function FeedbackSheet(
  { bottomSheetRef, sessionId, clipId, onClose },
  ref
) {
  const { session } = useSession();
  const { t } = useTranslation();
  const steps: Array<{ key: StepKey; label: string; placeholder: string }> = [
    { key: 'statement', label: t('feedback.stepStatement'), placeholder: t('feedback.placeholderStatement') },
    { key: 'questions', label: t('feedback.stepQuestions'), placeholder: t('feedback.placeholderQuestions') },
    { key: 'observations', label: t('feedback.stepObservations'), placeholder: t('feedback.placeholderObservations') },
    { key: 'opinions', label: t('feedback.stepOpinions'), placeholder: t('feedback.placeholderOpinions') },
  ];
  const [step, setStep] = useState<StepIndex>(0);
  const [statement, setStatement] = useState('');
  const [questions, setQuestions] = useState('');
  const [observations, setObservations] = useState('');
  const [opinions, setOpinions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const current = steps[step];
  const currentValue =
    current.key === 'statement'
      ? statement
      : current.key === 'questions'
        ? questions
        : current.key === 'observations'
          ? observations
          : opinions;

  const setCurrentValue = (value: string) => {
    if (current.key === 'statement') setStatement(value);
    else if (current.key === 'questions') setQuestions(value);
    else if (current.key === 'observations') setObservations(value);
    else setOpinions(value);
  };

  const reset = useCallback(() => {
    setStep(0);
    setStatement('');
    setQuestions('');
    setObservations('');
    setOpinions('');
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  useEffect(() => {
    reset();
  }, [clipId, reset]);

  useImperativeHandle(
    ref,
    () => ({
      reset,
    }),
    [reset]
  );

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = async () => {
    if (!session?.access_token || !clipId) {
      Alert.alert(t('feedback.submitFailed'), t('feedback.clipNotReady'));
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`/sessions/${sessionId}/clips/${clipId}/feedback`, {
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
      setSubmitError(null);
      handleClose();
      bottomSheetRef.current?.close();
    } catch (error) {
      if (error instanceof ApiRequestError && (error.reason === 'timeout' || error.reason === 'network')) {
        setSubmitError(t('feedback.retryMessage'));
      } else {
        Alert.alert(t('feedback.submitFailed'), error instanceof Error ? error.message : t('feedback.submitFailed'));
        setSubmitError(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={['70%', '90%']}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <View style={styles.stepRow}>
          {steps.map((item, idx) => {
            const isActive = idx === step;
            return (
              <View key={item.key} style={[styles.stepPill, isActive ? styles.stepPillActive : styles.stepPillInactive]}>
                <Text style={[styles.stepPillText, isActive ? styles.stepPillTextActive : styles.stepPillTextInactive]}>
                  {idx + 1}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.stepLabel}>{current.label}</Text>

        <TextInput
          style={styles.input}
          multiline
          value={currentValue}
          onChangeText={setCurrentValue}
          placeholder={current.placeholder}
          placeholderTextColor={theme.light.muted}
          textAlignVertical="top"
          editable={!isSubmitting}
        />

        {submitError && (
          <RetryPrompt
            message={submitError}
            onRetry={handleSubmit}
            loading={isSubmitting}
          />
        )}

        {step < 3 ? (
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep((prev) => (prev + 1) as StepIndex)}>
            <Text style={styles.nextButtonText}>{t('feedback.next')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{t('feedback.submit')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: theme.light.ground,
  },
  handle: {
    backgroundColor: theme.light.inactive,
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
    backgroundColor: theme.light.mine,
  },
  stepPillInactive: {
    backgroundColor: theme.light.border,
  },
  stepPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepPillTextActive: {
    color: '#FFFFFF',
  },
  stepPillTextInactive: {
    color: theme.light.muted,
  },
  stepLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.light.active,
  },
  input: {
    minHeight: 120,
    backgroundColor: theme.light.chrome,
    borderWidth: 1,
    borderColor: theme.light.border,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: theme.light.active,
    fontSize: 15,
  },
  nextButton: {
    backgroundColor: theme.light.mine,
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
    backgroundColor: theme.light.amber,
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
