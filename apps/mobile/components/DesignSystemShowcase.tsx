import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { theme } from '../lib/theme';
import { useTheme } from '../lib/contexts/ThemeContext';

/**
 * DesignSystemShowcase - Demonstrates the world-class design improvements
 * This component showcases the enhanced theme system, typography, spacing,
 * shadows, and micro-interactions implemented across the app.
 */
export function DesignSystemShowcase() {
  const { colors } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }] 
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Design System Showcase</Text>
          <Text style={styles.subtitle}>World-Class UI Components</Text>
        </View>

        {/* Typography Scale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typography Scale</Text>
          <View style={styles.typographyGrid}>
            <Text style={styles.typographySample}>xs - The quick brown fox</Text>
            <Text style={styles.typographySampleSm}>sm - The quick brown fox</Text>
            <Text style={styles.typographySampleBase}>base - The quick brown fox</Text>
            <Text style={styles.typographySampleLg}>lg - The quick brown fox</Text>
            <Text style={styles.typographySampleXl}>xl - The quick brown fox</Text>
            <Text style={styles.typographySample2xl}>2xl - The quick brown fox</Text>
            <Text style={styles.typographySample3xl}>3xl - The quick brown fox</Text>
            <Text style={styles.typographySample4xl}>4xl - The quick brown fox</Text>
            <Text style={styles.typographySample5xl}>5xl - The quick brown fox</Text>
            <Text style={styles.typographySample6xl}>6xl - The quick brown fox</Text>
          </View>
        </View>

        {/* Color Palette */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Palette</Text>
          <View style={styles.colorGrid}>
            <ColorSwatch name="Ground" color={colors.ground} />
            <ColorSwatch name="Chrome" color={colors.chrome} />
            <ColorSwatch name="Surface" color={colors.surface} />
            <ColorSwatch name="Active" color={colors.active} />
            <ColorSwatch name="Muted" color={colors.muted} />
            <ColorSwatch name="Capture" color={colors.capture} />
            <ColorSwatch name="Mine" color={colors.mine} />
            <ColorSwatch name="Warm" color={colors.warm} />
            <ColorSwatch name="Amber" color={colors.amber} />
            <ColorSwatch name="Success" color={colors.success} />
            <ColorSwatch name="Warning" color={colors.warning} />
            <ColorSwatch name="Error" color={colors.error} />
          </View>
        </View>

        {/* Shadow System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shadow System</Text>
          <View style={styles.shadowGrid}>
            <ShadowBox name="sm" shadow={theme.shadows.sm} />
            <ShadowBox name="md" shadow={theme.shadows.md} />
            <ShadowBox name="lg" shadow={theme.shadows.lg} />
            <ShadowBox name="xl" shadow={theme.shadows.xl} />
          </View>
        </View>

        {/* Spacing System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spacing System</Text>
          <View style={styles.spacingGrid}>
            <SpacingBox name="1 (4px)" size={theme.spacing['1']} />
            <SpacingBox name="2 (8px)" size={theme.spacing['2']} />
            <SpacingBox name="3 (12px)" size={theme.spacing['3']} />
            <SpacingBox name="4 (16px)" size={theme.spacing['4']} />
            <SpacingBox name="5 (20px)" size={theme.spacing['5']} />
            <SpacingBox name="6 (24px)" size={theme.spacing['6']} />
            <SpacingBox name="8 (32px)" size={theme.spacing['8']} />
            <SpacingBox name="10 (40px)" size={theme.spacing['10']} />
          </View>
        </View>

        {/* Border Radius */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Border Radius</Text>
          <View style={styles.radiusGrid}>
            <RadiusBox name="sm" radius={theme.spacing.radiusSm} />
            <RadiusBox name="md" radius={theme.spacing.radiusMd} />
            <RadiusBox name="lg" radius={theme.spacing.radiusLg} />
            <RadiusBox name="xl" radius={theme.spacing.radiusXl} />
            <RadiusBox name="2xl" radius={theme.spacing.radius2xl} />
            <RadiusBox name="3xl" radius={theme.spacing.radius3xl} />
            <RadiusBox name="full" radius={theme.spacing.radiusFull} />
          </View>
        </View>

        {/* Interactive Elements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Elements</Text>
          <View style={styles.interactiveGrid}>
            <InteractiveButton label="Primary" variant="primary" />
            <InteractiveButton label="Secondary" variant="secondary" />
            <InteractiveButton label="Outline" variant="outline" />
            <InteractiveButton label="Ghost" variant="ghost" />
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function ColorSwatch({ name, color }: { name: string; color: string }) {
  const styles = createColorSwatchStyles(color);
  return (
    <View style={styles.container}>
      <View style={styles.swatch} />
      <Text style={styles.label}>{name}</Text>
      <Text style={styles.value}>{color}</Text>
    </View>
  );
}

function ShadowBox({ name, shadow }: { name: string; shadow: any }) {
  const styles = createShadowBoxStyles();
  return (
    <View style={styles.container}>
      <View style={[styles.box, shadow]} />
      <Text style={styles.label}>{name}</Text>
    </View>
  );
}

function SpacingBox({ name, size }: { name: string; size: number }) {
  const styles = createSpacingBoxStyles();
  return (
    <View style={styles.container}>
      <View style={[styles.box, { height: size }]} />
      <Text style={styles.label}>{name}</Text>
    </View>
  );
}

function RadiusBox({ name, radius }: { name: string; radius: number }) {
  const styles = createRadiusBoxStyles();
  return (
    <View style={styles.container}>
      <View style={[styles.box, { borderRadius: radius }]} />
      <Text style={styles.label}>{name}</Text>
    </View>
  );
}

function InteractiveButton({ label, variant }: { label: string; variant: 'primary' | 'secondary' | 'outline' | 'ghost' }) {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const styles = createInteractiveButtonStyles(colors, variant);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={styles.button}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={styles.text}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.ground,
    },
    content: {
      padding: theme.spacing['6'],
    },
    header: {
      marginBottom: theme.spacing['8'],
      alignItems: 'center',
    },
    title: {
      fontSize: theme.typography.sizes['4xl'],
      fontWeight: theme.typography.weights.black,
      color: colors.active,
      marginBottom: theme.spacing['2'],
      textAlign: 'center',
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    subtitle: {
      fontSize: theme.typography.sizes.lg,
      color: colors.muted,
      textAlign: 'center',
      fontWeight: theme.typography.weights.medium,
    },
    section: {
      marginBottom: theme.spacing['8'],
    },
    sectionTitle: {
      fontSize: theme.typography.sizes['2xl'],
      fontWeight: theme.typography.weights.bold,
      color: colors.active,
      marginBottom: theme.spacing['4'],
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    typographyGrid: {
      gap: theme.spacing['3'],
    },
    typographySample: {
      fontSize: theme.typography.sizes.xs,
      color: colors.active,
      fontFamily: theme.typography.bodyFamily,
    },
    typographySampleSm: {
      fontSize: theme.typography.sizes.sm,
      color: colors.active,
      fontFamily: theme.typography.bodyFamily,
    },
    typographySampleBase: {
      fontSize: theme.typography.sizes.base,
      color: colors.active,
      fontFamily: theme.typography.bodyFamily,
    },
    typographySampleLg: {
      fontSize: theme.typography.sizes.lg,
      color: colors.active,
      fontFamily: theme.typography.bodyFamily,
    },
    typographySampleXl: {
      fontSize: theme.typography.sizes.xl,
      color: colors.active,
      fontFamily: theme.typography.bodyFamily,
    },
    typographySample2xl: {
      fontSize: theme.typography.sizes['2xl'],
      color: colors.active,
      fontFamily: theme.typography.displayFamily,
      fontWeight: theme.typography.weights.semibold,
    },
    typographySample3xl: {
      fontSize: theme.typography.sizes['3xl'],
      color: colors.active,
      fontFamily: theme.typography.displayFamily,
      fontWeight: theme.typography.weights.semibold,
    },
    typographySample4xl: {
      fontSize: theme.typography.sizes['4xl'],
      color: colors.active,
      fontFamily: theme.typography.displayFamily,
      fontWeight: theme.typography.weights.bold,
    },
    typographySample5xl: {
      fontSize: theme.typography.sizes['5xl'],
      color: colors.active,
      fontFamily: theme.typography.displayFamily,
      fontWeight: theme.typography.weights.bold,
    },
    typographySample6xl: {
      fontSize: theme.typography.sizes['6xl'],
      color: colors.active,
      fontFamily: theme.typography.displayFamily,
      fontWeight: theme.typography.weights.black,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing['3'],
    },
    shadowGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: theme.spacing['4'],
    },
    spacingGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: theme.spacing['4'],
    },
    radiusGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: theme.spacing['4'],
    },
    interactiveGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: theme.spacing['4'],
    },
  });
}

function createColorSwatchStyles(color: string) {
  return StyleSheet.create({
    container: {
      width: 80,
      alignItems: 'center',
    },
    swatch: {
      width: 60,
      height: 60,
      backgroundColor: color,
      borderRadius: theme.spacing.radiusMd,
      marginBottom: theme.spacing['2'],
      borderWidth: 1,
      borderColor: theme.light.border,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.light.active,
      textAlign: 'center',
    },
    value: {
      fontSize: theme.typography.sizes.xs,
      color: theme.light.muted,
      textAlign: 'center',
      marginTop: theme.spacing['0.5'],
    },
  });
}

function createShadowBoxStyles() {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    box: {
      width: 60,
      height: 60,
      backgroundColor: theme.light.surface,
      borderRadius: theme.spacing.radiusMd,
      marginBottom: theme.spacing['2'],
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.light.active,
    },
  });
}

function createSpacingBoxStyles() {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    box: {
      width: 60,
      backgroundColor: theme.light.capture,
      borderRadius: theme.spacing.radiusSm,
      marginBottom: theme.spacing['2'],
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.light.active,
    },
  });
}

function createRadiusBoxStyles() {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    box: {
      width: 60,
      height: 60,
      backgroundColor: theme.light.warm,
      marginBottom: theme.spacing['2'],
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.light.active,
    },
  });
}

function createInteractiveButtonStyles(colors: any, variant: 'primary' | 'secondary' | 'outline' | 'ghost') {
  const baseStyles = {
    button: {
      paddingHorizontal: theme.spacing['4'],
      paddingVertical: theme.spacing['3'],
      borderRadius: theme.spacing.radiusLg,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      ...theme.shadows.sm,
    } as const,
    text: {
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: theme.typography.letterSpacing.tight,
    } as const,
  };

  const variantStyles = {
    primary: {
      button: { ...baseStyles.button, backgroundColor: colors.capture },
      text: { ...baseStyles.text, color: colors.onCapture },
    },
    secondary: {
      button: { ...baseStyles.button, backgroundColor: colors.warm },
      text: { ...baseStyles.text, color: colors.onCapture },
    },
    outline: {
      button: { ...baseStyles.button, backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border },
      text: { ...baseStyles.text, color: colors.active },
    },
    ghost: {
      button: { ...baseStyles.button, backgroundColor: 'transparent' },
      text: { ...baseStyles.text, color: colors.muted },
    },
  };

  return variantStyles[variant];
}
