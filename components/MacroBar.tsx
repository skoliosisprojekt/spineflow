import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

export function MacroBar({ label, current, target, color }: MacroBarProps) {
  const { theme } = useTheme();
  const percentage = Math.min((current / target) * 100, 100);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    label: {
      fontSize: 11,
      color: theme.text3,
    },
    current: {
      fontSize: 11,
      color: theme.text,
      fontWeight: '600',
    },
    barBackground: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.sepLight,
    },
    barFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: color,
      width: `${percentage}%`,
    },
    target: {
      fontSize: 10,
      color: theme.text4,
      marginTop: 2,
      textAlign: 'right',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.current}>{current}g</Text>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.target}>/ {target}g</Text>
    </View>
  );
}
