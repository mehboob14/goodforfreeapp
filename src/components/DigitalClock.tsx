import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNow } from '../hooks/useNow';
import { formatTime, formatDate } from '../utils/time';
import { useSettings } from '../context/SettingsContext';

interface Props {
  timeZone?: string;
  size?: number; // base font size for the time
  showDateOverride?: boolean;
}

export default function DigitalClock({ timeZone, size = 64, showDateOverride }: Props) {
  const { settings, theme } = useSettings();
  const now = useNow(settings.showSeconds);

  const { time, meridiem } = formatTime(now, {
    use24Hour: settings.use24Hour,
    showSeconds: settings.showSeconds,
    timeZone,
  });
  const showDate = showDateOverride ?? settings.showDate;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.time, { color: theme.text, fontSize: size }]}>{time}</Text>
        {meridiem && (
          <Text style={[styles.meridiem, { color: theme.accent, fontSize: size * 0.3 }]}>
            {meridiem}
          </Text>
        )}
      </View>
      {showDate && (
        <Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(now, timeZone)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  time: { fontWeight: '200', letterSpacing: 1, fontVariant: ['tabular-nums'] },
  meridiem: { fontWeight: '700', marginTop: 10, marginLeft: 6 },
  date: { fontSize: 16, marginTop: 8, fontWeight: '500' },
});
