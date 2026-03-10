import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Defs, LinearGradient, Stop, Text as SvgText, Circle } from 'react-native-svg';
import type { WorkoutRecord } from '../stores/historyStore';

export function useChartInfo() {
  const { t } = useTranslation();
  return () => Alert.alert(
    t('home.chartInfoTitle') || 'Wie wird das berechnet?',
    t('home.chartInfoBody') || 'Trainingsvolumen pro Tag = Summe aus Gewicht × Wiederholungen aller abgeschlossenen Sätze (in kg).\n\nKörpergewichtsübungen fließen nicht ins Volumen ein.\n\nHöhere Werte = mehr geleistete Arbeit.',
    [{ text: 'OK' }]
  );
}

type Period = 7 | 15 | 30;
const PERIODS: Period[] = [7, 15, 30];
// How often to show a tick label per period
const TICK_EVERY: Record<Period, number> = { 7: 2, 15: 3, 30: 7 };

interface Props {
  workouts: WorkoutRecord[];
  width: number;
}

const CHART_HEIGHT = 120;
const PADDING = { top: 12, bottom: 28, left: 8, right: 8 };

export default function PerformanceChart({ workouts, width }: Props) {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<Period>(30);

  const chartW = width - PADDING.left - PADDING.right;
  const chartH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const days = useMemo(() => {
    const tickEvery = TICK_EVERY[period];
    const result: { label: string; value: number; isTick: boolean }[] = [];
    const now = new Date();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayWorkouts = workouts.filter((w) => new Date(w.date).toDateString() === dateStr);
      const totalVolume = dayWorkouts.reduce((sum, w) => sum + (w.totalVolume ?? 0), 0);
      const isTick = i % tickEvery === 0;
      const label = isTick ? d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'numeric' }) : '';
      result.push({ label, value: totalVolume, isTick });
    }
    return result;
  }, [workouts, i18n.language, period]);

  const maxVal = Math.max(...days.map((d) => d.value), 1);

  const points = days.map((d, i) => ({
    x: PADDING.left + (i / Math.max(days.length - 1, 1)) * chartW,
    y: PADDING.top + chartH - (d.value / maxVal) * chartH,
    value: d.value,
  }));

  const linePath = points.reduce((path, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${path} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');

  const fillPath = `${linePath} L ${points[points.length - 1].x} ${PADDING.top + chartH} L ${points[0].x} ${PADDING.top + chartH} Z`;

  const todayPt = points[points.length - 1];
  const hasTodayData = todayPt.value > 0;

  return (
    <View>
      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
            hitSlop={6}
            accessibilityRole="button"
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
              {p}d
            </Text>
          </Pressable>
        ))}
      </View>

      {/* SVG chart */}
      <Svg width={width} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00B894" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#00B894" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        <Path d={fillPath} fill="url(#chartFill)" />
        <Path d={linePath} stroke="#00B894" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((pt, i) =>
          days[i].isTick && days[i].label ? (
            <SvgText
              key={i}
              x={pt.x}
              y={PADDING.top + chartH + 16}
              fontSize="9"
              fill="#8E8E93"
              textAnchor="middle"
            >
              {days[i].label}
            </SvgText>
          ) : null
        )}

        {hasTodayData && (
          <Circle cx={todayPt.x} cy={todayPt.y} r="4" fill="#00B894" stroke="#FFFFFF" strokeWidth="2" />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  periodBtnActive: {
    backgroundColor: '#E8FAF5',
    borderColor: '#00B894',
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  periodBtnTextActive: {
    color: '#00B894',
  },
});
