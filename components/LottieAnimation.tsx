import { useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface LottieAnimationProps {
  source: any;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: ViewStyle;
  onAnimationFinish?: () => void;
}

export default function LottieAnimation({
  width = 120,
  height = 120,
  style,
}: LottieAnimationProps) {
  return <View style={[styles.container, { width, height }, style]} />;
}

/** No-op stub for useOneShotLottie */
export function useOneShotLottie() {
  const ref = useRef<null>(null);
  const play = () => {};
  return { ref, play };
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
