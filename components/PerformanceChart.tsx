import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText, Circle } from 'react-native-svg';
import type { WorkoutRecord } from '../stores/historyStore';

interface Props {
  workouts: WorkoutRecord[];
  width: number;
}

const CHART_HEIGHT = 120;
const PADDING = { top: 12, bottom: 28, left: 8, right: 8 };

export default function PerformanceChart({ workouts, width }: Props) {
  const { i18n } = useTranslation();

  const chartW = width - PADDING.left - PADDING.right;
  const chartH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Build 30-day data: total completed sets per day
  const days = useMemo(() => {
    const result: { label: string; value: number; isWeekBoundary: boolean }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayWorkouts = workouts.filter((w) => new Date(w.date).toDateString() === dateStr);
      const totalSets = dayWorkouts.reduce((sum, w) => sum + w.completedSets, 0);
      const label = i % 7 === 0 ? d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'numeric' }) : '';
      result.push({ label, value: totalSets, isWeekBoundary: i % 7 === 0 });
    }
    return result;
  }, [workouts, i18n.language]);

  const maxVal = Math.max(...days.map((d) => d.value), 1);

  // Map to SVG coordinates
  const points = days.map((d, i) => ({
    x: PADDING.left + (i / (days.length - 1)) * chartW,
    y: PADDING.top + chartH - (d.value / maxVal) * chartH,
    value: d.value,
    label: d.label,
  }));

  // Smooth line path (catmull-rom spline approximation)
  const linePath = points.reduce((path, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${path} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');

  // Fill area under the line
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${PADDING.top + chartH} L ${points[0].x} ${PADDING.top + chartH} Z`;

  // Find today's point (last point)
  const todayPt = points[points.length - 1];
  const hasTodayData = todayPt.value > 0;

  return (
    <View>
      <Svg width={width} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00B894" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#00B894" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Fill */}
        <Path d={fillPath} fill="url(#chartFill)" />

        {/* Line */}
        <Path d={linePath} stroke="#00B894" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Week boundary tick marks */}
        {points.map((pt, i) =>
          days[i].isWeekBoundary && days[i].label ? (
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

        {/* Today dot */}
        {hasTodayData && (
          <Circle cx={todayPt.x} cy={todayPt.y} r="4" fill="#00B894" stroke="#FFFFFF" strokeWidth="2" />
        )}
      </Svg>
    </View>
  );
}
