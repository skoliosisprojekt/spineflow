import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNetwork } from '../lib/network';

const BANNER_HEIGHT = 36;

export default function OfflineBanner() {
  const { isOnline } = useNetwork();
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOnline ? -BANNER_HEIGHT : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  // Always render — animation slides it in/out
  return (
    <Animated.View
      style={[s.banner, { transform: [{ translateY }] }]}
      accessibilityLabel={t('offline.banner')}
      accessibilityRole="alert"
      pointerEvents="none"
    >
      <MaterialIcons name="cloud-off" size={14} color="#FFFFFF" />
      <Text style={s.text} numberOfLines={1}>{t('offline.banner')}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: '#636366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
