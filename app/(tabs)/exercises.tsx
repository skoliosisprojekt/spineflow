import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { exercises, muscleGroups } from '../../data/exercises';
import { getSafety } from '../../lib/safety';
import { useProfileStore } from '../../stores/settingsStore';
import ExerciseCard from '../../components/ExerciseCard';
import { exerciseNames } from '../../data/exercises';
import type { Exercise, SafetyLevel } from '../../types';

type MuscleFilter = typeof muscleGroups[number]['id'];

export default function ExercisesScreen() {
  const [filter, setFilter] = useState<MuscleFilter>('all');
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { curveType, surgery } = useProfileStore();

  const filtered = useMemo(() => {
    let list = exercises;
    if (filter !== 'all') {
      list = list.filter((e) => e.muscle === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((e) => {
        const name = exerciseNames[e.id] || '';
        return name.toLowerCase().includes(q) || e.muscle.includes(q);
      });
    }
    return list;
  }, [filter, search]);

  const getExerciseSafety = useCallback(
    (ex: Exercise): SafetyLevel => getSafety(ex.id, ex.safety, curveType, surgery),
    [curveType, surgery],
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard
        exercise={item}
        safety={getExerciseSafety(item)}
        onPress={() => router.push(`/exercise/${item.id}` as any)}
      />
    ),
    [getExerciseSafety, router],
  );

  const keyExtractor = useCallback((item: Exercise) => String(item.id), []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Exercises</Text>
        <Text style={styles.subtitle}>{exercises.length} exercises with safety ratings</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#AEAEB2"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search exercises"
        />
        {search.length > 0 && (
          <Pressable
            onPress={() => setSearch('')}
            hitSlop={8}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <MaterialIcons name="close" size={18} color="#AEAEB2" />
          </Pressable>
        )}
      </View>

      {/* Muscle Group Filter Tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={muscleGroups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterList}
        renderItem={({ item }) => {
          const active = filter === item.id;
          return (
            <Pressable
              onPress={() => setFilter(item.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter: ${item.label}`}
            >
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Exercise List */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={48} color="#E5E5EA" />
            <Text style={styles.emptyTitle}>No exercises found</Text>
            <Text style={styles.emptyText}>Try a different search or filter</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1E' },
  subtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    height: 44,
    padding: 0,
  },

  filterList: { flexGrow: 0, flexShrink: 0 },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: '#00B894' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#3C3C43' },
  filterLabelActive: { color: '#FFFFFF' },

  listContent: { paddingTop: 4, paddingBottom: 100 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
});
