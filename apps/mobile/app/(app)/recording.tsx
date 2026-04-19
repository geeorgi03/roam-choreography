import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Video } from 'expo-av';
import { useTheme } from '../../lib/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function RecordingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));

  const styles = createStyles(colors);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Pulse animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording, pulseAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const handleStop = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    router.push('/session/new');
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recording</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Video Preview */}
      <View style={styles.videoContainer}>
        <View style={styles.videoPreview}>
          <Text style={styles.videoPlaceholderText}>Camera Preview</Text>
        </View>
        
        {/* Recording Indicator */}
        {isRecording && (
          <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </Animated.View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
        
        <View style={styles.buttonContainer}>
          {!isRecording ? (
            <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
              <Text style={styles.recordButtonText}>REC</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
                <Text style={styles.pauseButtonText}>
                  {isPaused ? 'RESUME' : 'PAUSE'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <Text style={styles.stopButtonText}>STOP</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.ground, // #0A0908
    },
    header: {
      backgroundColor: colors.surface, // #1E1C18
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // #3A3530
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: 'Georgia, serif',
      fontSize: 24,
      fontWeight: '600',
      color: colors.active, // #F4EBD6
    },
    closeButton: {
      fontSize: 32,
      color: colors.active, // #F4EBD6
      fontWeight: '300',
    },
    videoContainer: {
      flex: 1,
      margin: 16,
      backgroundColor: colors.surface, // #1E1C18
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
      overflow: 'hidden',
      position: 'relative',
    },
    videoPreview: {
      flex: 1,
      backgroundColor: colors.surfaceElevated, // #252322
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoPlaceholderText: {
      fontSize: 18,
      color: colors.muted, // #B8B3A8
    },
    recordingIndicator: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: colors.primary, // #E06E3F
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    recordingDot: {
      width: 8,
      height: 8,
      backgroundColor: colors.active, // #F4EBD6
      borderRadius: 4,
    },
    recordingText: {
      color: colors.active, // #F4EBD6
      fontSize: 12,
      fontWeight: '600',
    },
    controls: {
      backgroundColor: colors.surface, // #1E1C18
      borderTopWidth: 1,
      borderTopColor: colors.border, // #3A3530
      paddingHorizontal: 24,
      paddingVertical: 32,
      alignItems: 'center',
    },
    timer: {
      fontFamily: 'Georgia, serif',
      fontSize: 48,
      fontWeight: '700',
      color: colors.active, // #F4EBD6
      marginBottom: 32,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 24,
      alignItems: 'center',
    },
    recordButton: {
      width: 80,
      height: 80,
      backgroundColor: colors.primary, // #E06E3F
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    recordButtonText: {
      color: colors.active, // #F4EBD6
      fontSize: 16,
      fontWeight: '700',
    },
    pauseButton: {
      width: 80,
      height: 80,
      backgroundColor: colors.success, // #4CAF50
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    pauseButtonText: {
      color: colors.active, // #F4EBD6
      fontSize: 14,
      fontWeight: '700',
    },
    stopButton: {
      width: 80,
      height: 80,
      backgroundColor: colors.error, // #F44336
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    stopButtonText: {
      color: colors.active, // #F4EBD6
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
