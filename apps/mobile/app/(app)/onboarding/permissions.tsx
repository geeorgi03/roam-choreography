import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../lib/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function PermissionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    storage: false,
    notifications: false,
  });

  const styles = createStyles(colors);

  const handlePermissionToggle = (permission: string) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission as keyof typeof prev]
    }));
  };

  const handleContinue = () => {
    router.push('/(app)');
  };

  const permissionsList = [
    {
      id: 'camera',
      icon: 'C',
      title: 'Camera Access',
      description: 'Allow Roam to access your camera for recording choreography',
    },
    {
      id: 'microphone',
      icon: 'M',
      title: 'Microphone Access',
      description: 'Allow Roam to access your microphone for audio recording',
    },
    {
      id: 'storage',
      icon: 'S',
      title: 'Storage Access',
      description: 'Allow Roam to save and access your choreography videos',
    },
    {
      id: 'notifications',
      icon: 'N',
      title: 'Notifications',
      description: 'Allow Roam to send you notifications about your sessions',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>
          Roam needs access to your device to provide the best choreography experience
        </Text>
      </View>

      {/* Permissions List */}
      <View style={styles.permissionsList}>
        {permissionsList.map((permission) => (
          <View key={permission.id} style={styles.permissionItem}>
            <View style={styles.permissionIcon}>
              <Text style={styles.permissionIconText}>{permission.icon}</Text>
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>{permission.title}</Text>
              <Text style={styles.permissionDescription}>
                {permission.description}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.permissionToggle,
                permissions[permission.id as keyof typeof permissions] && styles.permissionToggleActive
              ]}
              onPress={() => handlePermissionToggle(permission.id)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.permissionToggleKnob,
                permissions[permission.id as keyof typeof permissions] && styles.permissionToggleKnobActive
              ]} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            Object.values(permissions).every(p => p) && styles.continueButtonActive
          ]}
          onPress={handleContinue}
          disabled={!Object.values(permissions).every(p => p)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            Object.values(permissions).every(p => p) && styles.continueButtonTextActive
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.ground, // #0A0908
    },
    header: {
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    title: {
      fontFamily: 'Georgia, serif',
      fontSize: 32,
      fontWeight: '700',
      color: colors.active, // #F4EBD6
      marginBottom: 16,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.muted, // #B8B3A8
      textAlign: 'center',
      lineHeight: 24,
    },
    permissionsList: {
      paddingHorizontal: 24,
    },
    permissionItem: {
      backgroundColor: colors.surface, // #1E1C18
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    permissionIcon: {
      width: 48,
      height: 48,
      backgroundColor: colors.primary, // #E06E3F
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    permissionIconText: {
      color: colors.active, // #F4EBD6
      fontSize: 24,
      fontWeight: '700',
    },
    permissionContent: {
      flex: 1,
    },
    permissionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.active, // #F4EBD6
      marginBottom: 4,
    },
    permissionDescription: {
      fontSize: 14,
      color: colors.muted, // #B8B3A8
      lineHeight: 20,
    },
    permissionToggle: {
      width: 48,
      height: 24,
      backgroundColor: colors.border, // #3A3530
      borderRadius: 12,
      position: 'relative',
    },
    permissionToggleActive: {
      backgroundColor: colors.primary, // #E06E3F
    },
    permissionToggleKnob: {
      width: 20,
      height: 20,
      backgroundColor: colors.active, // #F4EBD6
      borderRadius: 10,
      position: 'absolute',
      top: 2,
      left: 2,
    },
    permissionToggleKnobActive: {
      transform: [{ translateX: 24 }],
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      paddingTop: 20,
    },
    continueButton: {
      backgroundColor: colors.surface, // #1E1C18
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    continueButtonActive: {
      backgroundColor: colors.primary, // #E06E3F
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 8,
    },
    continueButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.muted, // #B8B3A8
    },
    continueButtonTextActive: {
      color: colors.active, // #F4EBD6
    },
  });
}
