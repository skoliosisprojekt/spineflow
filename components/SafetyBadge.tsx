import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { SafetyLevel } from '../types';

const safetyConfig: Record<SafetyLevel, {
  bg: string; color: string; icon: keyof typeof MaterialIcons.glyphMap; label: string;
}> = {
  safe:   { bg: '#E8FAF5', color: '#009B7D', icon: 'check-circle',  label: 'Safe' },
  modify: { bg: '#FFF3E0', color: '#CC7700', icon: 'warning',       label: 'Modify' },
  avoid:  { bg: '#FFF0EF', color: '#FF3B30', icon: 'block',         label: 'Avoid' },
};

interface SafetyBadgeProps {
  level: SafetyLevel;
  size?: 'small' | 'medium';
}

export default function SafetyBadge({ level, size = 'small' }: SafetyBadgeProps) {
  const config = safetyConfig[level];
  const isSmall = size === 'small';

  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }, isSmall ? styles.small : styles.medium]}
      accessibilityLabel={`Exercise safety: ${config.label}`}
      accessibilityRole="text"
    >
      <MaterialIcons
        name={config.icon}
        size={isSmall ? 12 : 16}
        color={config.color}
      />
      <Text style={[styles.label, { color: config.color }, isSmall ? styles.labelSmall : styles.labelMedium]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  label: {
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 11,
  },
  labelMedium: {
    fontSize: 14,
  },
});
