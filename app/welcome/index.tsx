import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, ViewToken } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { setWelcomeSeen } = useAuthStore();
  const { t } = useTranslation();

  const slides = [
    { id: '1', icon: 'fitness-center' as const, title: t('welcome.slide1Title'), desc: t('welcome.slide1Desc') },
    { id: '2', icon: 'verified-user' as const, title: t('welcome.slide2Title'), desc: t('welcome.slide2Desc') },
    { id: '3', icon: 'bar-chart' as const, title: t('welcome.slide3Title'), desc: t('welcome.slide3Desc') },
  ];

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.skip} onPress={setWelcomeSeen} accessibilityLabel="Skip introduction">
        <Text style={s.skipText}>{t('common.skip')}</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>  
            <View style={s.iconCircle}>
              <MaterialIcons name={item.icon} size={60} color="#00B894" />
            </View>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.desc}>{item.desc}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={s.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={s.footer}>
        {currentIndex === slides.length - 1 ? (
          <TouchableOpacity style={s.btn} onPress={setWelcomeSeen} accessibilityLabel="Get started">
            <Text style={s.btnText}>{t('welcome.getStarted')}</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.btn} onPress={handleNext} accessibilityLabel="Next slide">
            <Text style={s.btnText}>{t('common.next')}</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  skip: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8 },
  skipText: { fontSize: 16, color: '#00B894', fontWeight: '500' },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E8FAF5',
    justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1E', textAlign: 'center', marginBottom: 16 },
  desc: { fontSize: 16, color: '#3C3C43', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E5EA' },
  dotActive: { backgroundColor: '#00B894', width: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 48 },
  btn: { flexDirection: 'row', backgroundColor: '#00B894', borderRadius: 12,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 48 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
