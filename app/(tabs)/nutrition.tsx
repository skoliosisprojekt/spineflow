import { useEffect, useState, useRef, useMemo } from 'react';
import { trackEvent } from '../../lib/posthog';
import ErrorBoundary from '../../components/ErrorBoundary';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Modal, KeyboardAvoidingView, Platform, Animated as RNAnimated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNutritionStore, HydrationEntry, MealEntry, MealType } from '../../stores/nutritionStore';
import type { HydrationType } from '../../types';
import { WaterDrop } from '../../components/animations';
import { useProfileStore } from '../../stores/settingsStore';
import { calculateTDEE, calculateMacros } from '../../lib/nutrition';
import type { Gender } from '../../types';

const QUICK_ADDS: { type: HydrationType; labelKey: string; amount: number; icon: keyof typeof MaterialIcons.glyphMap; color: string }[] = [
  { type: 'water', labelKey: 'nutrition.water', amount: 250, icon: 'water-drop', color: '#5B8DEF' },
  { type: 'water', labelKey: 'nutrition.largeWater', amount: 500, icon: 'water-drop', color: '#5B8DEF' },
  { type: 'shake', labelKey: 'nutrition.proteinShake', amount: 300, icon: 'blender', color: '#AF52DE' },
  { type: 'bcaa', labelKey: 'nutrition.bcaa', amount: 300, icon: 'science', color: '#FF9500' },
];

const MEAL_CONFIG: Record<MealType, { labelKey: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }> = {
  breakfast: { labelKey: 'nutrition.breakfast', icon: 'free-breakfast', color: '#FF9500' },
  lunch: { labelKey: 'nutrition.lunch', icon: 'lunch-dining', color: '#00B894' },
  dinner: { labelKey: 'nutrition.dinner', icon: 'dinner-dining', color: '#5B8DEF' },
  snack: { labelKey: 'nutrition.snack', icon: 'cookie', color: '#AF52DE' },
};

function ProgressBar({ progress, color, label, value }: { progress: number; color: string; label: string; value: string }) {
  const clamped = Math.min(progress, 1);
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={[styles.progressValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MealRow({ meal, onDelete }: { meal: MealEntry; onDelete: () => void }) {
  const { t } = useTranslation();
  const time = new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const cfg = MEAL_CONFIG[meal.mealType];
  return (
    <View style={styles.entryRow}>
      <View style={[styles.entryIcon, { backgroundColor: cfg.color + '15' }]}>
        <MaterialIcons name={cfg.icon} size={16} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryType}>{meal.name}</Text>
        <Text style={styles.entryTime}>{t(cfg.labelKey)} · {time}</Text>
      </View>
      <View style={styles.macroCol}>
        <Text style={styles.mealCalories}>{meal.calories} {t('nutrition.kcal')}</Text>
        <Text style={styles.mealMacros}>{meal.protein}P · {meal.carbs}C · {meal.fat}F</Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove meal">
        <MaterialIcons name="close" size={16} color="#AEAEB2" />
      </Pressable>
    </View>
  );
}

function HydrationRow({ entry, onDelete }: { entry: HydrationEntry; onDelete: () => void }) {
  const { t } = useTranslation();
  const time = new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const config = { water: { icon: 'water-drop' as const, color: '#5B8DEF' }, shake: { icon: 'blender' as const, color: '#AF52DE' }, bcaa: { icon: 'science' as const, color: '#FF9500' } };
  const c = config[entry.type];
  const labelMap: Record<string, string> = { water: t('nutrition.water'), shake: t('nutrition.proteinShake'), bcaa: t('nutrition.bcaa') };
  return (
    <View style={styles.entryRow}>
      <View style={[styles.entryIcon, { backgroundColor: c.color + '15' }]}>
        <MaterialIcons name={c.icon} size={16} color={c.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryType}>{labelMap[entry.type]}</Text>
        <Text style={styles.entryTime}>{time}</Text>
      </View>
      <Text style={styles.entryAmount}>{entry.amount} ml</Text>
      <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove entry">
        <MaterialIcons name="close" size={16} color="#AEAEB2" />
      </Pressable>
    </View>
  );
}

function AddMealModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (meal: Omit<MealEntry, 'id' | 'time'>) => void }) {
  const { t } = useTranslation();
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const reset = () => { setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setMealType('lunch'); };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      mealType,
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('nutrition.addMeal')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={22} color="#8E8E93" />
            </Pressable>
          </View>

          {/* Meal type selector */}
          <View style={styles.mealTypeRow}>
            {(Object.keys(MEAL_CONFIG) as MealType[]).map((mt) => {
              const cfg = MEAL_CONFIG[mt];
              const active = mealType === mt;
              return (
                <Pressable
                  key={mt}
                  style={[styles.mealTypeBtn, active && { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}
                  onPress={() => setMealType(mt)}
                >
                  <MaterialIcons name={cfg.icon} size={16} color={active ? cfg.color : '#8E8E93'} />
                  <Text style={[styles.mealTypeBtnText, active && { color: cfg.color }]}>{t(cfg.labelKey)}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Name */}
          <TextInput
            style={styles.modalInput}
            placeholder={t('nutrition.mealPlaceholder')}
            placeholderTextColor="#AEAEB2"
            value={name}
            onChangeText={setName}
            accessibilityLabel="Meal name"
          />

          {/* Macros row */}
          <View style={styles.macroInputRow}>
            <View style={styles.macroInputGroup}>
              <Text style={styles.macroInputLabel}>{t('nutrition.kcal')}</Text>
              <TextInput style={styles.macroInput} placeholder="0" placeholderTextColor="#AEAEB2" value={calories} onChangeText={setCalories} keyboardType="numeric" accessibilityLabel="Calories" />
            </View>
            <View style={styles.macroInputGroup}>
              <Text style={styles.macroInputLabel}>{t('nutrition.protein')}</Text>
              <TextInput style={styles.macroInput} placeholder="0" placeholderTextColor="#AEAEB2" value={protein} onChangeText={setProtein} keyboardType="numeric" accessibilityLabel="Protein grams" />
            </View>
            <View style={styles.macroInputGroup}>
              <Text style={styles.macroInputLabel}>{t('nutrition.carbs')}</Text>
              <TextInput style={styles.macroInput} placeholder="0" placeholderTextColor="#AEAEB2" value={carbs} onChangeText={setCarbs} keyboardType="numeric" accessibilityLabel="Carbs grams" />
            </View>
            <View style={styles.macroInputGroup}>
              <Text style={styles.macroInputLabel}>{t('nutrition.fat')}</Text>
              <TextInput style={styles.macroInput} placeholder="0" placeholderTextColor="#AEAEB2" value={fat} onChangeText={setFat} keyboardType="numeric" accessibilityLabel="Fat grams" />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.modalAddBtn, pressed && { opacity: 0.85 }, !name.trim() && { opacity: 0.4 }]}
            onPress={handleAdd}
            disabled={!name.trim()}
            accessibilityRole="button"
          >
            <Text style={styles.modalAddBtnText}>{t('nutrition.addMeal')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BodyDataCard() {
  const { t } = useTranslation();
  const { setHeight, setWeight, setAge, setGender, saveBodyData } = useProfileStore();
  const [h, setH] = useState('');
  const [w, setW] = useState('');
  const [a, setA] = useState('');
  const [g, setG] = useState<Gender>('female');
  const [saving, setSaving] = useState(false);

  const valid = Number(h) > 0 && Number(w) > 0 && Number(a) > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setHeight(Number(h));
    setWeight(Number(w));
    setAge(Number(a));
    setGender(g);
    await saveBodyData();
    setSaving(false);
  };

  return (
    <View style={bdStyles.card}>
      <MaterialIcons name="person" size={36} color="#00B894" style={{ alignSelf: 'center', marginBottom: 8 }} />
      <Text style={bdStyles.title}>{t('nutrition.bodyDataTitle')}</Text>
      <Text style={bdStyles.subtitle}>{t('nutrition.bodyDataSubtitle')}</Text>

      <Text style={bdStyles.label}>{t('nutrition.metabolicBasis')}</Text>
      <Text style={bdStyles.metabolicHint}>{t('nutrition.metabolicHint')}</Text>
      <View style={bdStyles.genderRow}>
        <Pressable style={[bdStyles.genderBtn, g === 'female' && bdStyles.genderActive]} onPress={() => setG('female')} accessibilityRole="radio">
          <Text style={[bdStyles.genderText, g === 'female' && bdStyles.genderTextActive]}>♀ {t('nutrition.female')}</Text>
        </Pressable>
        <Pressable style={[bdStyles.genderBtn, g === 'male' && bdStyles.genderActive]} onPress={() => setG('male')} accessibilityRole="radio">
          <Text style={[bdStyles.genderText, g === 'male' && bdStyles.genderTextActive]}>♂ {t('nutrition.male')}</Text>
        </Pressable>
        <Pressable style={[bdStyles.genderBtn, g === 'diverse' && bdStyles.genderActive]} onPress={() => setG('diverse')} accessibilityRole="radio">
          <Text style={[bdStyles.genderText, g === 'diverse' && bdStyles.genderTextActive]}>⚧ {t('nutrition.diverse')}</Text>
        </Pressable>
      </View>

      <View style={bdStyles.inputRow}>
        <View style={bdStyles.inputGroup}>
          <Text style={bdStyles.label}>{t('nutrition.height')}</Text>
          <TextInput style={bdStyles.input} value={h} onChangeText={setH} placeholder="175" placeholderTextColor="#AEAEB2" inputMode="numeric" keyboardType="number-pad" accessibilityLabel="Height cm" />
        </View>
        <View style={bdStyles.inputGroup}>
          <Text style={bdStyles.label}>{t('nutrition.weight')}</Text>
          <TextInput style={bdStyles.input} value={w} onChangeText={setW} placeholder="75" placeholderTextColor="#AEAEB2" inputMode="decimal" keyboardType="decimal-pad" accessibilityLabel="Weight kg" />
        </View>
        <View style={bdStyles.inputGroup}>
          <Text style={bdStyles.label}>{t('nutrition.age')}</Text>
          <TextInput style={bdStyles.input} value={a} onChangeText={setA} placeholder="30" placeholderTextColor="#AEAEB2" inputMode="numeric" keyboardType="number-pad" accessibilityLabel="Age" />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [bdStyles.btn, (!valid || saving) && { opacity: 0.4 }, pressed && { opacity: 0.82 }]}
        onPress={handleSave}
        disabled={!valid || saving}
        accessibilityRole="button"
      >
        <MaterialIcons name="calculate" size={18} color="#FFFFFF" />
        <Text style={bdStyles.btnText}>{saving ? t('common.loading') : t('nutrition.calculate')}</Text>
      </Pressable>
    </View>
  );
}

const bdStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, margin: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#8E8E93', textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  metabolicHint: { fontSize: 11, color: '#AEAEB2', lineHeight: 16, marginBottom: 8, marginTop: -2 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E5EA', alignItems: 'center', backgroundColor: '#F2F2F7' },
  genderActive: { borderColor: '#00B894', backgroundColor: '#E8FAF5' },
  genderText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  genderTextActive: { color: '#00B894' },
  inputRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 20 },
  inputGroup: { flex: 1, justifyContent: 'flex-end' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 13, fontSize: 20, fontWeight: '700', color: '#1C1C1E', textAlign: 'center' },
  btn: { flexDirection: 'row', backgroundColor: '#00B894', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

export default function NutritionScreenWrapper() {
  return <ErrorBoundary><NutritionScreen /></ErrorBoundary>;
}

function NutritionScreen() {
  const { t } = useTranslation();
  const { entries, meals, goals, addEntry, removeEntry, addMeal, removeMeal, setGoal, loadNutrition, clearToday } = useNutritionStore();
  const { height, weight, age, gender, goal: fitnessGoal, bodyType } = useProfileStore();
  const hasBodyData = height > 0 && weight > 0 && age > 0;
  const targets = useMemo(() => {
    if (!hasBodyData) return null;
    const tdee = calculateTDEE(weight, height, age, gender);
    return calculateMacros(tdee, fitnessGoal, bodyType, weight);
  }, [hasBodyData, weight, height, age, gender, fitnessGoal, bodyType]);
  const [editingGoal, setEditingGoal] = useState<'water' | 'protein' | 'calories' | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [showMealForm, setShowMealForm] = useState(false);
  const [showDropAnim, setShowDropAnim] = useState(false);
  const dropOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => { loadNutrition(); }, []);

  const handleQuickAdd = (type: HydrationType, amount: number) => {
    addEntry(type, amount);
    trackEvent('hydration_logged', { type, amount });
    setShowDropAnim(true);
    RNAnimated.sequence([
      RNAnimated.timing(dropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      RNAnimated.delay(800),
      RNAnimated.timing(dropOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowDropAnim(false));
  };

  const today = new Date().toDateString();
  const todayEntries = entries.filter((e) => new Date(e.time).toDateString() === today);
  const todayMeals = meals.filter((m) => new Date(m.time).toDateString() === today);

  // Hydration totals
  const todayHydration = todayEntries.reduce((s, e) => s + e.amount, 0);

  // Meal totals
  const mealCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const mealProtein = todayMeals.reduce((s, m) => s + m.protein, 0);
  const mealCarbs = todayMeals.reduce((s, m) => s + m.carbs, 0);
  const mealFat = todayMeals.reduce((s, m) => s + m.fat, 0);

  // Add shake protein estimate
  const shakeProtein = todayEntries.filter((e) => e.type === 'shake').length * 25;
  const totalProtein = mealProtein + shakeProtein;

  const commitGoal = () => {
    if (editingGoal) {
      const defaults = { water: 3000, protein: 120, calories: 2500 };
      const val = Math.max(100, Number(goalInput) || defaults[editingGoal]);
      setGoal(editingGoal, val);
      setEditingGoal(null);
    }
  };

  if (!hasBodyData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} accessibilityRole="header">{t('nutrition.title')}</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>👑 {t('nutrition.premiumBadge')}</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 8 }]} showsVerticalScrollIndicator={false}>
          <BodyDataCard />
          <View style={styles.premiumBanner}>
            <MaterialIcons name="workspace-premium" size={15} color="#FF9500" />
            <Text style={styles.premiumBannerText}>{t('nutrition.premiumBanner')}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title} accessibilityRole="header">{t('nutrition.title')}</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>👑 {t('nutrition.premiumBadge')}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
        </View>
        <Pressable onPress={() => setShowMealForm(true)} style={styles.addMealHeaderBtn} accessibilityRole="button" accessibilityLabel="Add meal">
          <MaterialIcons name="add" size={20} color="#00B894" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Daily Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTopRow}>
            <View style={styles.calorieCircle}>
              <Text style={styles.calorieValue}>{mealCalories}</Text>
              <Text style={styles.calorieUnit}>/ {targets?.calories ?? goals.calories} {t('nutrition.kcal')}</Text>
            </View>
          </View>

          <View style={styles.macrosRow}>
            <ProgressBar progress={totalProtein / (targets?.protein ?? goals.protein)} color="#AF52DE" label={t('nutrition.protein')} value={`${totalProtein}/${targets?.protein ?? goals.protein}g`} />
            <ProgressBar progress={mealCarbs / (targets?.carbs ?? 300)} color="#FF9500" label={t('nutrition.carbs')} value={`${mealCarbs}/${targets?.carbs ?? 300}g`} />
            <ProgressBar progress={mealFat / (targets?.fat ?? 80)} color="#FF6B6B" label={t('nutrition.fat')} value={`${mealFat}/${targets?.fat ?? 80}g`} />
            <ProgressBar progress={todayHydration / goals.water} color="#5B8DEF" label={t('nutrition.water')} value={`${(todayHydration / 1000).toFixed(1)}/${(goals.water / 1000).toFixed(1)}L`} />
          </View>

          {/* Remaining calories */}
          {targets && (
            <View style={styles.remainingRow}>
              <MaterialIcons
                name={mealCalories >= targets.calories ? 'check-circle' : 'timer'}
                size={14}
                color={mealCalories >= targets.calories ? '#00B894' : '#8E8E93'}
              />
              <Text style={[styles.remainingText, mealCalories >= targets.calories && { color: '#00B894' }]}>
                {mealCalories >= targets.calories
                  ? t('nutrition.goalReached')
                  : `${targets.calories - mealCalories} ${t('nutrition.kcal')} ${t('nutrition.remaining')}`}
              </Text>
            </View>
          )}

          {/* Edit goals links */}
          <View style={styles.goalEditRow}>
            {editingGoal ? (
              <View style={styles.goalEditInput}>
                <Text style={styles.goalEditLabel}>
                  {editingGoal === 'water' ? t('nutrition.waterMl') : editingGoal === 'protein' ? t('nutrition.proteinG') : t('nutrition.caloriesLabel')}
                </Text>
                <TextInput style={styles.goalInput} value={goalInput} onChangeText={setGoalInput} keyboardType="numeric" onBlur={commitGoal} onSubmitEditing={commitGoal} autoFocus accessibilityLabel={`${editingGoal} goal`} />
              </View>
            ) : (
              <View style={styles.goalLinksRow}>
                <Pressable onPress={() => { setEditingGoal('calories'); setGoalInput(String(goals.calories)); }} hitSlop={6}>
                  <Text style={styles.goalLink}>{t('nutrition.calories')}</Text>
                </Pressable>
                <Text style={styles.goalDot}> · </Text>
                <Pressable onPress={() => { setEditingGoal('protein'); setGoalInput(String(goals.protein)); }} hitSlop={6}>
                  <Text style={styles.goalLink}>{t('nutrition.protein')}</Text>
                </Pressable>
                <Text style={styles.goalDot}> · </Text>
                <Pressable onPress={() => { setEditingGoal('water'); setGoalInput(String(goals.water)); }} hitSlop={6}>
                  <Text style={styles.goalLink}>{t('nutrition.water')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Add Meal Button */}
        <Pressable
          style={({ pressed }) => [styles.addMealBtn, pressed && { opacity: 0.85 }]}
          onPress={() => setShowMealForm(true)}
          accessibilityRole="button"
        >
          <MaterialIcons name="restaurant" size={18} color="#FFFFFF" />
          <Text style={styles.addMealBtnText}>{t('nutrition.addMeal')}</Text>
        </Pressable>

        {/* Quick Add Hydration */}
        <Text style={styles.sectionTitle}>{t('nutrition.quickAdd')}</Text>
        <View style={styles.quickGrid}>
          {QUICK_ADDS.map((qa, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.quickBtn, { borderColor: qa.color }, pressed && { opacity: 0.7 }]}
              onPress={() => handleQuickAdd(qa.type, qa.amount)}
              accessibilityRole="button"
              accessibilityLabel={`${t(qa.labelKey)} ${qa.amount}ml`}
            >
              <MaterialIcons name={qa.icon} size={18} color={qa.color} />
              <Text style={[styles.quickLabel, { color: qa.color }]}>{t(qa.labelKey)}</Text>
              <Text style={styles.quickAmount}>{qa.amount} ml</Text>
            </Pressable>
          ))}
        </View>

        {/* Today's Meals */}
        {todayMeals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('nutrition.meals')}</Text>
            {[...todayMeals].reverse().map((m) => (
              <MealRow key={m.id} meal={m} onDelete={() => removeMeal(m.id)} />
            ))}
          </>
        )}

        {/* Today's Hydration Log */}
        {todayEntries.length > 0 && (
          <>
            <View style={styles.logHeader}>
              <Text style={styles.sectionTitle}>{t('nutrition.hydrationLog')}</Text>
              <Pressable onPress={clearToday} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear today">
                <Text style={styles.clearBtn}>{t('nutrition.clearAll')}</Text>
              </Pressable>
            </View>
            {[...todayEntries].reverse().map((e) => (
              <HydrationRow key={e.id} entry={e} onDelete={() => removeEntry(e.id)} />
            ))}
          </>
        )}

        {/* Premium banner */}
        <View style={styles.premiumBanner}>
          <MaterialIcons name="workspace-premium" size={15} color="#FF9500" />
          <Text style={styles.premiumBannerText}>{t('nutrition.premiumBanner')}</Text>
        </View>
      </ScrollView>

      <AddMealModal visible={showMealForm} onClose={() => setShowMealForm(false)} onAdd={addMeal} />

      {/* Water-drop animation feedback */}
      {showDropAnim && (
        <RNAnimated.View style={[styles.dropAnimOverlay, { opacity: dropOpacity }]} pointerEvents="none">
          <WaterDrop size={40} />
        </RNAnimated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1E' },
  subtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  addMealHeaderBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Overview card
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  overviewTopRow: { alignItems: 'center', marginBottom: 16 },
  calorieCircle: { alignItems: 'center' },
  calorieValue: { fontSize: 36, fontWeight: '800', color: '#1C1C1E' },
  calorieUnit: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },

  macrosRow: { gap: 10 },
  progressItem: { marginBottom: 2 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#3C3C43' },
  progressValue: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: '#E5E5EA', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  goalEditRow: { marginTop: 12, alignItems: 'center' },
  goalLinksRow: { flexDirection: 'row', alignItems: 'center' },
  goalLink: { fontSize: 12, color: '#8E8E93', textDecorationLine: 'underline' },
  goalDot: { fontSize: 12, color: '#8E8E93' },
  goalEditInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalEditLabel: { fontSize: 12, color: '#3C3C43' },
  goalInput: {
    fontSize: 14, fontWeight: '600', color: '#1C1C1E', backgroundColor: '#F2F2F7',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, width: 70, textAlign: 'center',
  },

  // Add meal button
  addMealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#00B894', borderRadius: 14, paddingVertical: 14, gap: 8,
    marginBottom: 20, minHeight: 48,
  },
  addMealBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 10, paddingHorizontal: 4,
  },

  // Quick Add
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickBtn: {
    width: '48%', flexGrow: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1.5, padding: 10, alignItems: 'center', gap: 2, minHeight: 64, justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, fontWeight: '700' },
  quickAmount: { fontSize: 10, color: '#8E8E93', fontWeight: '500' },

  // Log
  logHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4, marginBottom: 10,
  },
  clearBtn: { fontSize: 13, color: '#FF3B30', fontWeight: '500' },

  entryRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12, marginBottom: 6, gap: 10,
  },
  entryIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  entryType: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  entryTime: { fontSize: 11, color: '#8E8E93' },
  entryAmount: { fontSize: 14, fontWeight: '700', color: '#3C3C43' },

  // Meal-specific
  macroCol: { alignItems: 'flex-end' },
  mealCalories: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  mealMacros: { fontSize: 10, color: '#8E8E93', marginTop: 1 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },

  mealTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealTypeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#E5E5EA', backgroundColor: '#F2F2F7',
  },
  mealTypeBtnText: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },

  modalInput: {
    backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1C1C1E', marginBottom: 12,
  },
  macroInputRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  macroInputGroup: { flex: 1 },
  macroInputLabel: { fontSize: 10, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' },
  macroInput: {
    backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 10,
    fontSize: 15, fontWeight: '600', color: '#1C1C1E', textAlign: 'center',
  },

  modalAddBtn: {
    backgroundColor: '#00B894', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', minHeight: 52,
  },
  modalAddBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  dropAnimOverlay: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    zIndex: 50,
  },

  // Premium badge + banner
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  premiumBadge: {
    backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#FF950040',
  },
  premiumBadgeText: { fontSize: 11, fontWeight: '700', color: '#FF9500' },
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8EC', borderRadius: 12, padding: 12, marginTop: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#FF950030',
  },
  premiumBannerText: { fontSize: 12, color: '#8E8E93', flex: 1, lineHeight: 16 },

  // Remaining calories row
  remainingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  remainingText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
});
