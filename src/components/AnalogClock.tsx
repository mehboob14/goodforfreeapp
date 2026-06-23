import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { useNow } from '../hooks/useNow';
import { getClockParts, formatDate } from '../utils/time';
import { useSettings } from '../context/SettingsContext';

interface Props {
  timeZone?: string;
  size?: number;
  showDateOverride?: boolean;
}

export default function AnalogClock({ timeZone, size = 240, showDateOverride }: Props) {
  const { settings, theme } = useSettings();
  const now = useNow(settings.showSeconds);
  const { hours, minutes, seconds } = getClockParts(now, timeZone);
  const showDate = showDateOverride ?? settings.showDate;

  const center = size / 2;
  const radius = center - 6;

  const secondAngle = seconds * 6; // 360/60
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 360/12

  // Returns the [x, y] endpoint of a hand at a given angle/length.
  const hand = (angleDeg: number, length: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: center + length * Math.cos(rad), y: center + length * Math.sin(rad) };
  };

  const hourEnd = hand(hourAngle, radius * 0.5);
  const minuteEnd = hand(minuteAngle, radius * 0.72);
  const secondEnd = hand(secondAngle, radius * 0.82);

  const ticks = Array.from({ length: 12 }, (_, i) => i);

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.border}
          strokeWidth={2}
          fill={theme.surface}
        />
        {/* Hour ticks */}
        <G>
          {ticks.map((i) => {
            const a = i * 30;
            const outer = hand(a, radius - 4);
            const inner = hand(a, radius - (i % 3 === 0 ? 18 : 10));
            return (
              <Line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={i % 3 === 0 ? theme.text : theme.textMuted}
                strokeWidth={i % 3 === 0 ? 3 : 1.5}
                strokeLinecap="round"
              />
            );
          })}
        </G>
        {/* Hour hand */}
        <Line
          x1={center}
          y1={center}
          x2={hourEnd.x}
          y2={hourEnd.y}
          stroke={theme.text}
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Minute hand */}
        <Line
          x1={center}
          y1={center}
          x2={minuteEnd.x}
          y2={minuteEnd.y}
          stroke={theme.text}
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* Second hand */}
        {settings.showSeconds && (
          <Line
            x1={center}
            y1={center}
            x2={secondEnd.x}
            y2={secondEnd.y}
            stroke={theme.accent}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
        <Circle cx={center} cy={center} r={6} fill={theme.accent} />
      </Svg>
      {showDate && (
        <Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(now, timeZone)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  date: { fontSize: 16, marginTop: 16, fontWeight: '500' },
});
