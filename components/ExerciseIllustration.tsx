import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Muscle group visual config: icon + accent color
const muscleConfig: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; color: string; bg: string }> = {
  chest: { icon: 'fitness-center', color: '#E85D75', bg: '#FDE8EC' },
  back: { icon: 'accessibility-new', color: '#5B8DEF', bg: '#E8F0FD' },
  legs: { icon: 'directions-run', color: '#00B894', bg: '#E6F9F4' },
  shoulders: { icon: 'accessibility', color: '#FF9500', bg: '#FFF3E0' },
  arms: { icon: 'sports-martial-arts', color: '#AF52DE', bg: '#F3E8FD' },
  core: { icon: 'self-improvement', color: '#FF6B6B', bg: '#FFEBEB' },
};

interface ExerciseIllustrationProps {
  muscle: string;
  exerciseName: string;
  /** Path to a Lottie JSON file. When provided and valid, renders animation instead of placeholder. */
  lottieSource?: any;
}

export default function ExerciseIllustration({ muscle, exerciseName }: ExerciseIllustrationProps) {
  const config = muscleConfig[muscle] || { icon: 'fitness-center', color: '#00B894', bg: '#E6F9F4' };

  // TODO: When Lottie files are available, add:
  // if (lottieSource) {
  //   return <LottieView source={lottieSource} autoPlay loop style={...} />;
  // }

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      {/* Background decorative circles */}
      <View style={[styles.circle1, { backgroundColor: config.color, opacity: 0.06 }]} />
      <View style={[styles.circle2, { backgroundColor: config.color, opacity: 0.04 }]} />

      {/* Main icon */}
      <View style={[styles.iconRing, { borderColor: config.color }]}>
        <MaterialIcons name={config.icon} size={56} color={config.color} />
      </View>

      {/* Exercise name */}
      <Text style={[styles.label, { color: config.color }]} numberOfLines={2}>
        {exerciseName}
      </Text>

      {/* Placeholder badge */}
      <View style={[styles.badge, { backgroundColor: config.color }]}>
        <MaterialIcons name="play-circle-outline" size={12} color="#FFFFFF" />
        <Text style={styles.badgeText}>Animation coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 200,
  },
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -30,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -20,
    left: -30,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    opacity: 0.7,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
