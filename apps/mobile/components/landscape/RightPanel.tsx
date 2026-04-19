import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';

export type ToolSection = {
  id: string;
  title: string;
  tools: ToolItem[];
};

export type ToolItem = {
  id: string;
  name: string;
  icon?: string;
  isActive?: boolean;
  onPress?: () => void;
};

export type PropertyField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'toggle';
  value?: any;
  options?: string[];
  onChange?: (value: any) => void;
  disabled?: boolean;
};

export type RightPanelProps = {
  /** Panel sections to display */
  sections?: ToolSection[];
  /** Properties to display */
  properties?: PropertyField[];
  /** Panel title */
  title?: string;
  /** Show/hide tools section */
  showTools?: boolean;
  /** Show/hide properties section */
  showProperties?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** On tool press callback */
  onToolPress?: (tool: ToolItem) => void;
};

/**
 * Professional Right Panel for A3 Landscape Mode
 * 
 * Matches the App Build reference design with:
 * - Tool palette for editing
 * - Property inspector for selected items
 * - Professional controls and inputs
 * - Collapsible sections
 */
export function RightPanel({
  sections = [],
  properties = [],
  title = 'Inspector',
  showTools = true,
  showProperties = true,
  style,
  onToolPress,
}: RightPanelProps) {
  const { colors } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tools', 'properties']));
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({});

  const styles = createRightPanelStyles(colors);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleToolPress = (tool: ToolItem) => {
    if (onToolPress) {
      onToolPress(tool);
    } else if (tool.onPress) {
      tool.onPress();
    }
  };

  const handlePropertyChange = (field: PropertyField, value: any) => {
    setPropertyValues(prev => ({ ...prev, [field.id]: value }));
    field.onChange?.(value);
  };

  const renderToolGrid = (tools: ToolItem[]) => (
    <View style={styles.toolGrid}>
      {tools.map((tool) => (
        <TouchableOpacity
          key={tool.id}
          style={[
            styles.toolButton,
            tool.isActive && styles.toolButtonActive,
          ]}
          onPress={() => handleToolPress(tool)}
          activeOpacity={0.7}
        >
          <Text style={styles.toolIcon}>{tool.icon || 'T'}</Text>
          <Text style={styles.toolName}>{tool.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPropertyField = (field: PropertyField) => {
    const value = propertyValues[field.id] ?? field.value;

    switch (field.type) {
      case 'text':
        return (
          <TextInput
            style={styles.propertyInput}
            value={value}
            onChangeText={(text) => handlePropertyChange(field, text)}
            placeholder={field.label}
            placeholderTextColor={colors.muted}
            editable={!field.disabled}
          />
        );

      case 'number':
        return (
          <TextInput
            style={[styles.propertyInput, styles.numberInput]}
            value={value?.toString()}
            onChangeText={(text) => handlePropertyChange(field, parseInt(text) || 0)}
            placeholder={field.label}
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            editable={!field.disabled}
          />
        );

      case 'select':
        return (
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => {/* Handle select */}}
            activeOpacity={0.7}
            disabled={field.disabled}
          >
            <Text style={styles.selectText}>
              {value || field.label}
            </Text>
            <Text style={styles.selectArrow}>×</Text>
          </TouchableOpacity>
        );

      case 'toggle':
        return (
          <TouchableOpacity
            style={[
              styles.toggleInput,
              value && styles.toggleInputActive,
            ]}
            onPress={() => handlePropertyChange(field, !value)}
            activeOpacity={0.7}
            disabled={field.disabled}
          >
            <View style={[
              styles.toggleKnob,
              value && styles.toggleKnobActive,
            ]} />
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Panel Header */}
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{title}</Text>
        </View>

        {/* Tools Section */}
        {showTools && sections.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('tools')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>Tools</Text>
              <Text style={styles.sectionToggle}>
                {expandedSections.has('tools') ? '×' : '+'}
              </Text>
            </TouchableOpacity>
            
            {expandedSections.has('tools') && (
              <View style={styles.sectionContent}>
                {sections.map((section) => (
                  <View key={section.id} style={styles.toolSection}>
                    <Text style={styles.toolSectionTitle}>{section.title}</Text>
                    {renderToolGrid(section.tools)}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Properties Section */}
        {showProperties && properties.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('properties')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>Properties</Text>
              <Text style={styles.sectionToggle}>
                {expandedSections.has('properties') ? '×' : '+'}
              </Text>
            </TouchableOpacity>
            
            {expandedSections.has('properties') && (
              <View style={styles.sectionContent}>
                {properties.map((field) => (
                  <View key={field.id} style={styles.propertyField}>
                    <Text style={styles.propertyLabel}>{field.label}</Text>
                    {renderPropertyField(field)}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('actions')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionToggle}>
              {expandedSections.has('actions') ? '×' : '+'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.has('actions') && (
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <Text style={styles.actionButtonText}>Reset to Default</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <Text style={styles.actionButtonText}>Copy Properties</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <Text style={styles.actionButtonText}>Paste Properties</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createRightPanelStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.landscape.rightPanel.backgroundColor,
      borderLeftWidth: 1,
      borderLeftColor: theme.landscape.rightPanel.borderLeft,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.landscape.rightPanel.padding,
    },
    panelHeader: {
      marginBottom: theme.landscape.spacing.panelGap * 2,
    },
    panelTitle: {
      fontSize: theme.landscape.typography.panelTitle.fontSize,
      fontWeight: theme.landscape.typography.panelTitle.fontWeight,
      fontFamily: theme.landscape.typography.panelTitle.fontFamily,
      color: theme.landscape.typography.panelTitle.color,
    },
    section: {
      marginBottom: theme.landscape.spacing.panelGap,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(0, 122, 255, 0.05)',
      borderRadius: 6,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: theme.landscape.typography.panelTitle.fontSize,
      fontWeight: theme.landscape.typography.panelTitle.fontWeight,
      fontFamily: theme.landscape.typography.panelTitle.fontFamily,
      color: theme.landscape.typography.panelTitle.color,
    },
    sectionToggle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      width: 20,
      textAlign: 'center',
    },
    sectionContent: {
      paddingLeft: 8,
    },
    toolSection: {
      marginBottom: theme.landscape.spacing.panelGap,
    },
    toolSectionTitle: {
      fontSize: theme.landscape.typography.panelLabel.fontSize,
      fontWeight: theme.landscape.typography.panelLabel.fontWeight,
      color: theme.landscape.typography.panelLabel.color,
      marginBottom: 8,
    },
    toolGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    toolButton: {
      width: 60,
      height: 60,
      backgroundColor: colors.chrome,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
    },
    toolButtonActive: {
      backgroundColor: colors.primaryBg,
      borderColor: colors.primary,
    },
    toolIcon: {
      fontSize: 20,
      marginBottom: 4,
      color: colors.muted,
    },
    toolName: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.muted,
      textAlign: 'center',
    },
    propertyField: {
      marginBottom: theme.landscape.spacing.panelGap,
    },
    propertyLabel: {
      fontSize: theme.landscape.typography.panelLabel.fontSize,
      fontWeight: theme.landscape.typography.panelLabel.fontWeight,
      color: theme.landscape.typography.panelLabel.color,
      marginBottom: 6,
    },
    propertyInput: {
      ...theme.landscape.components.propertyInput,
      backgroundColor: colors.chrome,
      borderWidth: 1,
      borderColor: colors.borderLight,
      color: colors.active,
    },
    numberInput: {
      textAlign: 'right',
    },
    selectInput: {
      ...theme.landscape.components.propertyInput,
      backgroundColor: colors.chrome,
      borderWidth: 1,
      borderColor: colors.borderLight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectText: {
      color: colors.active,
      fontSize: 14,
    },
    selectArrow: {
      fontSize: 12,
      color: colors.muted,
    },
    toggleInput: {
      width: 48,
      height: 24,
      backgroundColor: colors.borderLight,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 2,
    },
    toggleInputActive: {
      backgroundColor: colors.primary,
    },
    toggleKnob: {
      width: 20,
      height: 20,
      backgroundColor: colors.chrome,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleKnobActive: {
      transform: [{ translateX: 24 }],
    },
    actionButton: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.chrome,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 6,
      alignItems: 'center',
      marginBottom: 6,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.active,
    },
  });
}

export default RightPanel;
