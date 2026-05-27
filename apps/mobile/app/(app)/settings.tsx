import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: true,
    highQuality: false,
    darkMode: true,
    soundEffects: true,
    hapticFeedback: true,
  });

  const styles = createStyles(colors);

  const handleSettingToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBack = () => {
    router.back();
  };

  const sections = [
    {
      title: 'Recording',
      icon: 'R',
      items: [
        { key: 'highQuality', label: 'High Quality Recording', description: 'Record in 4K resolution' },
        { key: 'soundEffects', label: 'Sound Effects', description: 'Play sounds during recording' },
        { key: 'hapticFeedback', label: 'Haptic Feedback', description: 'Vibrate on actions' },
      ],
    },
    {
      title: 'General',
      icon: 'G',
      items: [
        { key: 'notifications', label: 'Notifications', description: 'Receive session reminders' },
        { key: 'autoSave', label: 'Auto Save', description: 'Automatically save recordings' },
        { key: 'darkMode', label: 'Dark Mode', description: 'Use dark theme' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>×</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Settings Sections */}
      <View style={styles.content}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            
            {section.items.map((item, index) => (
              <View key={item.key} style={[
                styles.settingItem,
                index === section.items.length - 1 && styles.settingItemLast
              ]}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
                <Switch
                  value={settings[item.key as keyof typeof settings]}
                  onValueChange={() => handleSettingToggle(item.key as keyof typeof settings)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.active}
                  ios_backgroundColor={colors.border}
                />
              </View>
            ))}
          </View>
        ))}
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
      backgroundColor: colors.surface, // #1E1C18
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // #3A3530
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      fontSize: 32,
      color: colors.active, // #F4EBD6
      fontWeight: '300',
    },
    title: {
      fontFamily: 'Inter Display, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 28,
      fontWeight: '700',
      color: colors.active, // #F4EBD6
      letterSpacing: -0.3,
    },
    placeholder: {
      width: 32,
    },
    content: {
      padding: 16,
    },
    section: {
      backgroundColor: colors.surface, // #1E1C18
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    sectionHeader: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // #3A3530
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      fontSize: 20,
      color: colors.primary, // #E06E3F
      marginRight: 12,
    },
    sectionTitle: {
      fontFamily: 'Inter Display, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 20,
      fontWeight: '600',
      color: colors.active, // #F4EBD6
      letterSpacing: -0.1,
    },
    settingItem: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // #3A3530
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    settingContent: {
      flex: 1,
      marginRight: 16,
    },
    settingLabel: {
      fontFamily: 'Inter Display, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 16,
      fontWeight: '500',
      color: colors.active, // #F4EBD6
      marginBottom: 4,
      letterSpacing: -0.1,
    },
    settingDescription: {
      fontFamily: 'Inter Display, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 14,
      fontWeight: '400',
      color: colors.muted, // #B8B3A8
      lineHeight: 20,
      letterSpacing: 0.1,
    },
  });
}
