import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../lib/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const styles = createStyles(colors);

  const handleGetStarted = () => {
    router.push('/onboarding/permissions');
  };

  return (
    <View style={styles.container}>
      {/* ROAM Logo with Georgia serif */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Roam</Text>
        <Text style={styles.tagline}>Choreography Studio</Text>
      </View>

      {/* Illustration with warm glow */}
      <View style={styles.illustration}>
        <View style={styles.glowEffect} />
        <View style={styles.phoneSilhouettes}>
          <View style={[styles.phone, styles.phoneLeft]} />
          <View style={[styles.phone, styles.phoneCenter]}>
            <View style={styles.waveform}>
              {[...Array(7)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { height: Math.random() * 20 + 10 }
                  ]}
                />
              ))}
            </View>
            <View style={styles.recordingDot} />
          </View>
          <View style={[styles.phone, styles.phoneRight]} />
        </View>
      </View>

      {/* Get Started Button */}
      <TouchableOpacity
        style={styles.getStartedButton}
        onPress={handleGetStarted}
        activeOpacity={0.8}
      >
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.ground, // #0A0908
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 60,
    },
    logo: {
      fontFamily: 'Georgia, serif',
      fontSize: 48,
      fontStyle: 'italic',
      color: colors.active, // #F4EBD6
      marginBottom: 8,
    },
    tagline: {
      fontSize: 18,
      color: colors.muted, // #B8B3A8
      textAlign: 'center',
    },
    illustration: {
      width: 300,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 60,
      position: 'relative',
    },
    glowEffect: {
      position: 'absolute',
      width: 400,
      height: 400,
      borderRadius: 200,
      backgroundColor: 'rgba(224, 110, 63, 0.08)', // Coral glow
      top: -100,
      left: -50,
    },
    phoneSilhouettes: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    phone: {
      width: 60,
      height: 120,
      backgroundColor: colors.surface, // #1E1C18
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
      position: 'relative',
    },
    phoneLeft: {
      opacity: 0.7,
    },
    phoneCenter: {
      zIndex: 1,
    },
    phoneRight: {
      opacity: 0.7,
    },
    waveform: {
      position: 'absolute',
      bottom: 20,
      left: 10,
      right: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 2,
    },
    waveformBar: {
      width: 2,
      backgroundColor: colors.primary, // #E06E3F
      opacity: 0.6,
      borderRadius: 1,
    },
    recordingDot: {
      position: 'absolute',
      bottom: 45,
      width: 8,
      height: 8,
      backgroundColor: colors.primary, // #E06E3F
      borderRadius: 4,
      opacity: 0.9,
    },
    getStartedButton: {
      backgroundColor: colors.primary, // #E06E3F
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 8,
    },
    getStartedText: {
      color: colors.active, // #F4EBD6
      fontSize: 18,
      fontWeight: '600',
    },
  });
}
