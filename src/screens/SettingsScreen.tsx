import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useSettings } from '../context/SettingsContext';
import { ACCENT_CHOICES } from '../theme/themes';
import {
  requestNotificationPermission,
  sendTestNotification,
  getExpoPushToken,
  checkForNewArticlesAndNotify,
} from '../notifications/notifications';

export default function SettingsScreen() {
  const { settings, theme, update, reset } = useSettings();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    if (settings.notificationsEnabled) {
      getExpoPushToken().then(setPushToken);
    }
  }, [settings.notificationsEnabled]);

  const onToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Enable notifications for GoodForFree in your device Settings to receive article alerts.'
        );
        update({ notificationsEnabled: false });
        return;
      }
      update({ notificationsEnabled: true });
      getExpoPushToken().then(setPushToken);
    } else {
      update({ notificationsEnabled: false });
      setPushToken(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Settings</Text>

        {/* ---- Appearance ---- */}
        <Section title="Appearance" theme={theme}>
          <Row label="Follow system theme" theme={theme}>
            <Switch
              value={settings.followSystemTheme}
              onValueChange={(v) => update({ followSystemTheme: v })}
              trackColor={{ true: theme.accent }}
            />
          </Row>
          {!settings.followSystemTheme && (
            <Row label="Dark mode" theme={theme}>
              <Switch
                value={settings.themeMode === 'dark'}
                onValueChange={(v) => update({ themeMode: v ? 'dark' : 'light' })}
                trackColor={{ true: theme.accent }}
              />
            </Row>
          )}
          <View style={styles.rowColumn}>
            <Text style={[styles.label, { color: theme.text }]}>Accent color</Text>
            <View style={styles.swatchRow}>
              {ACCENT_CHOICES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => update({ accent: c })}
                  style={[
                    styles.swatch,
                    { backgroundColor: c, borderColor: settings.accent === c ? theme.text : 'transparent' },
                  ]}
                />
              ))}
            </View>
          </View>
        </Section>

        {/* ---- Clock ---- */}
        <Section title="Clock" theme={theme}>
          <View style={styles.rowColumn}>
            <Text style={[styles.label, { color: theme.text }]}>Default style</Text>
            <View style={styles.segment}>
              <Segment
                label="Digital"
                active={settings.clockType === 'digital'}
                onPress={() => update({ clockType: 'digital' })}
                theme={theme}
              />
              <Segment
                label="Analog"
                active={settings.clockType === 'analog'}
                onPress={() => update({ clockType: 'analog' })}
                theme={theme}
              />
            </View>
          </View>
          <Row label="24-hour time" theme={theme}>
            <Switch
              value={settings.use24Hour}
              onValueChange={(v) => update({ use24Hour: v })}
              trackColor={{ true: theme.accent }}
            />
          </Row>
          <Row label="Show seconds" theme={theme}>
            <Switch
              value={settings.showSeconds}
              onValueChange={(v) => update({ showSeconds: v })}
              trackColor={{ true: theme.accent }}
            />
          </Row>
          <Row label="Show date" theme={theme}>
            <Switch
              value={settings.showDate}
              onValueChange={(v) => update({ showDate: v })}
              trackColor={{ true: theme.accent }}
            />
          </Row>
        </Section>

        {/* ---- Notifications ---- */}
        <Section title="Notifications" theme={theme}>
          <Row label="Enable notifications" theme={theme}>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ true: theme.accent }}
            />
          </Row>
          {settings.notificationsEnabled && (
            <>
              <ActionRow
                label="Send a test notification"
                onPress={sendTestNotification}
                theme={theme}
              />
              <ActionRow
                label="Check for new articles now"
                onPress={async () => {
                  const id = await checkForNewArticlesAndNotify();
                  Alert.alert(
                    'Done',
                    id ? 'Found a new article — notification sent.' : 'No new articles since last check.'
                  );
                }}
                theme={theme}
              />
              {pushToken ? (
                <Pressable
                  onPress={async () => {
                    await Clipboard.setStringAsync(pushToken);
                    Alert.alert('Copied', 'Expo push token copied to clipboard.');
                  }}
                  style={styles.rowColumn}
                >
                  <Text style={[styles.label, { color: theme.text }]}>Expo push token (tap to copy)</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }} numberOfLines={1}>
                    {pushToken}
                  </Text>
                </Pressable>
              ) : (
                <Text style={{ color: theme.textMuted, fontSize: 12, paddingVertical: 8 }}>
                  Push token only available on a physical device with a dev/production build.
                </Text>
              )}
            </>
          )}
        </Section>

        <Pressable
          onPress={() =>
            Alert.alert('Reset settings', 'Restore all defaults?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: reset },
            ])
          }
          style={[styles.resetBtn, { borderColor: theme.border }]}
        >
          <Text style={{ color: '#FF6B6B', fontWeight: '700' }}>Reset to defaults</Text>
        </Pressable>

        <Text style={[styles.version, { color: theme.textMuted }]}>GoodForFree v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type T = ReturnType<typeof useSettings>['theme'];

function Section({ title, theme, children }: { title: string; theme: T; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

function Row({ label, theme, children }: { label: string; theme: T; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {children}
    </View>
  );
}

function ActionRow({ label, onPress, theme }: { label: string; onPress: () => void; theme: T }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.label, { color: theme.accent, fontWeight: '600' }]}>{label}</Text>
      <Text style={{ color: theme.accent }}>›</Text>
    </Pressable>
  );
}

function Segment({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: T;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentBtn,
        { backgroundColor: active ? theme.accent : 'transparent' },
      ]}
    >
      <Text style={{ color: active ? '#fff' : theme.textMuted, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowColumn: { paddingVertical: 14 },
  label: { fontSize: 16 },
  swatchRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3 },
  segment: { flexDirection: 'row', marginTop: 12, gap: 8 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  resetBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  version: { textAlign: 'center', marginTop: 20, fontSize: 12 },
});
