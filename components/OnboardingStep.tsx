import { ReactNode, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';

interface Option {
  id: string;
  label: string;
  description?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  options: Option[];
  selected: string | string[];
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack?: () => void;
  multiSelect?: boolean;
  extraContent?: ReactNode;
}

export default function OnboardingStep({
  step,
  totalSteps,
  title,
  subtitle,
  options,
  selected,
  onSelect,
  onNext,
  onBack,
  multiSelect = false,
  extraContent,
}: OnboardingStepProps) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useTranslation();

  const isSelected = (id: string) =>
    multiSelect ? (selected as string[]).includes(id) : selected === id;

  const hasSelection = multiSelect
    ? (selected as string[]).length > 0
    : selected !== '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < step ? styles.progressDone : i === step ? styles.progressActive : styles.progressInactive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.stepLabel}>{t('common.stepOf', { step: step + 1, total: totalSteps })}</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, isSelected(option.id) && styles.optionCardSelected]}
              onPress={() => onSelect(option.id)}
              accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
              accessibilityState={{ selected: isSelected(option.id) }}
              accessibilityLabel={`${option.label}. ${option.description || ''}`}
            >
              <View style={[styles.iconContainer, isSelected(option.id) && styles.iconContainerSelected]}>
                <MaterialIcons
                  name={option.icon}
                  size={24}
                  color={isSelected(option.id) ? '#FFFFFF' : C.text3}
                />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, isSelected(option.id) && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {option.description && (
                  <Text style={styles.optionDescription}>{option.description}</Text>
                )}
              </View>
              {isSelected(option.id) && (
                <MaterialIcons name="check-circle" size={24} color="#00B894" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {extraContent}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !hasSelection && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!hasSelection}
          accessibilityRole="button"
          accessibilityLabel="Continue to next step"
        >
          <Text style={styles.nextButtonText}>{t('common.next')}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 8 },
    backButton: { width: 48, height: 48, justifyContent: 'center', marginBottom: 8 },
    progressContainer: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    progressDot: { flex: 1, height: 4, borderRadius: 2 },
    progressDone: { backgroundColor: C.accent },
    progressActive: { backgroundColor: C.accent },
    progressInactive: { backgroundColor: C.sep },
    stepLabel: { fontSize: 12, color: C.text3 },
    content: { padding: 24, paddingTop: 16 },
    title: { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.text3, marginBottom: 24, lineHeight: 20 },
    optionsContainer: { gap: 12 },
    optionCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 16, padding: 16, borderWidth: 2, borderColor: 'transparent',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1, minHeight: 64,
    },
    optionCardSelected: { borderColor: C.accent, backgroundColor: C.accentLight },
    iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    iconContainerSelected: { backgroundColor: C.accent },
    optionText: { flex: 1 },
    optionLabel: { fontSize: 16, fontWeight: '600', color: C.text },
    optionLabelSelected: { color: C.accentDark },
    optionDescription: { fontSize: 12, color: C.text3, marginTop: 2 },
    footer: { padding: 24, paddingBottom: 40 },
    nextButton: { flexDirection: 'row', backgroundColor: C.accent, borderRadius: 12, paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 48 },
    nextButtonDisabled: { backgroundColor: C.text4 },
    nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  });
}
