import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { SafetyLevel } from '../types';
import { useTheme } from '../lib/theme';

const safetyConfig: Record<SafetyLevel, {
  bg: string; color: string; icon: keyof typeof MaterialIcons.glyphMap; labelKey: string;
}> = {
  safe:   { bg: '#E8FAF5', color: '#009B7D', icon: 'check-circle',  labelKey: 'safety.safe' },
  modify: { bg: '#FFF3E0', color: '#CC7700', icon: 'warning',       labelKey: 'safety.modify' },
  avoid:  { bg: '#FFF0EF', color: '#FF3B30', icon: 'block',         labelKey: 'safety.avoid' },
};

interface SafetyBadgeProps {
  level: SafetyLevel;
  size?: 'small' | 'medium';
}

export default function SafetyBadge({ level, size = 'small' }: SafetyBadgeProps) {
  const C = useTheme();
  const { t } = useTranslation();
  const config = safetyConfig[level];
  const isSmall = size === 'small';
  const bg = level === 'safe' ? C.accentLight : level === 'modify' ? C.orangeLight : C.redLight;
  const color = level === 'safe' ? C.accentDark : level === 'modify' ? C.orange : C.red;

  return (
    <View
      style={[styles.badge, { backgroundColor: bg }, isSmall ? styles.small : styles.medium]}
      accessibilityLabel={t(config.labelKey)}
      accessibilityRole="text"
    >
      <MaterialIcons
        name={config.icon}
        size={isSmall ? 12 : 16}
        color={color}
      />
      <Text style={[styles.label, { color }, isSmall ? styles.labelSmall : styles.labelMedium]}>
        {t(config.labelKey)}
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
