import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, style = {}, onPress, padding = 16 }: CardProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
  });

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent style={[styles.card, style]} onPress={onPress}>
      {children}
    </CardComponent>
  );
}
