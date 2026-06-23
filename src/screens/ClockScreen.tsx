import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DigitalClock from '../components/DigitalClock';
import AnalogClock from '../components/AnalogClock';
import { useSettings } from '../context/SettingsContext';

export default function ClockScreen() {
  const { settings, theme, update } = useSettings();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.clockArea}>
        {settings.clockType === 'analog' ? (
          <AnalogClock size={260} />
        ) : (
          <DigitalClock size={72} />
        )}
      </View>

      {/* Quick toggle between clock styles without leaving the screen. */}
      <View style={styles.switcher}>
        <StyleToggle
          label="Digital"
          active={settings.clockType === 'digital'}
          onPress={() => update({ clockType: 'digital' })}
          theme={theme}
        />
        <StyleToggle
          label="Analog"
          active={settings.clockType === 'analog'}
          onPress={() => update({ clockType: 'analog' })}
          theme={theme}
        />
      </View>
    </SafeAreaView>
  );
}

function StyleToggle({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useSettings>['theme'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.toggle,
        {
          backgroundColor: active ? theme.accent : theme.surface,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}
    >
      <Text style={{ color: active ? '#fff' : theme.textMuted, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  clockArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  switcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 24,
  },
  toggle: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
});
