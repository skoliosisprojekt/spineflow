import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

export type ModalVariant = 'danger' | 'warning' | 'default';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  primaryLabel: string;
  onPrimary: () => void;
  cancelLabel?: string;
  variant?: ModalVariant;
  icon?: keyof typeof MaterialIcons.glyphMap;
  loading?: boolean;
}

export function CustomModal({
  visible,
  onClose,
  title,
  description,
  primaryLabel,
  onPrimary,
  cancelLabel = 'Cancel',
  variant = 'default',
  icon,
  loading = false,
}: CustomModalProps) {
  const C = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.88);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
        mass: 0.9,
      }).start();
    }
  }, [visible, scaleAnim]);

  const primaryColor =
    variant === 'danger' ? C.red : variant === 'warning' ? C.orange : C.accent;
  const iconBg =
    variant === 'danger' ? C.redLight : variant === 'warning' ? C.orangeLight : C.accentLight;
  const defaultIcon: keyof typeof MaterialIcons.glyphMap =
    variant === 'danger' ? 'delete-forever' : variant === 'warning' ? 'warning-amber' : 'info-outline';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={!loading ? onClose : undefined}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={!loading ? onClose : undefined}
          accessibilityLabel="Close modal"
        />
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: C.card, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Colored icon ring */}
          <View style={[styles.iconRing, { backgroundColor: iconBg }]}>
            <MaterialIcons name={icon ?? defaultIcon} size={32} color={primaryColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>

          {/* Description */}
          {!!description && (
            <Text style={[styles.description, { color: C.text3 }]}>{description}</Text>
          )}

          {/* Button row */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                { backgroundColor: C.bg },
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={[styles.cancelText, { color: C.text2 }]}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: primaryColor },
                (pressed || loading) && { opacity: 0.82 },
              ]}
              onPress={onPrimary}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>{primaryLabel}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 14,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
