import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNow } from '../hooks/useNow';
import { formatTime } from '../utils/time';
import { useSettings } from '../context/SettingsContext';

interface City {
  id: string;
  name: string;
  timeZone: string;
}

// A curated set the user can add from. Extend freely.
const AVAILABLE_CITIES: City[] = [
  { id: 'la', name: 'Los Angeles', timeZone: 'America/Los_Angeles' },
  { id: 'ny', name: 'New York', timeZone: 'America/New_York' },
  { id: 'sao', name: 'São Paulo', timeZone: 'America/Sao_Paulo' },
  { id: 'lon', name: 'London', timeZone: 'Europe/London' },
  { id: 'par', name: 'Paris', timeZone: 'Europe/Paris' },
  { id: 'dxb', name: 'Dubai', timeZone: 'Asia/Dubai' },
  { id: 'kar', name: 'Karachi', timeZone: 'Asia/Karachi' },
  { id: 'del', name: 'New Delhi', timeZone: 'Asia/Kolkata' },
  { id: 'sin', name: 'Singapore', timeZone: 'Asia/Singapore' },
  { id: 'tok', name: 'Tokyo', timeZone: 'Asia/Tokyo' },
  { id: 'syd', name: 'Sydney', timeZone: 'Australia/Sydney' },
  { id: 'akl', name: 'Auckland', timeZone: 'Pacific/Auckland' },
];

const STORAGE_KEY = '@goodforfree/worldclocks/v1';
const DEFAULT_IDS = ['ny', 'lon', 'dxb', 'tok'];

export default function WorldClockScreen() {
  const { theme, settings } = useSettings();
  const now = useNow(settings.showSeconds);
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_IDS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setSelectedIds(JSON.parse(raw));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
  }, [selectedIds, ready]);

  const cities = selectedIds
    .map((id) => AVAILABLE_CITIES.find((c) => c.id === id))
    .filter(Boolean) as City[];

  const toggleCity = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>World Clock</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.addBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={cities}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40 }}>
            No cities yet. Tap “+ Add”.
          </Text>
        }
        renderItem={({ item }) => {
          const { time, meridiem } = formatTime(now, {
            use24Hour: settings.use24Hour,
            showSeconds: settings.showSeconds,
            timeZone: item.timeZone,
          });
          return (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View>
                <Text style={[styles.cityName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.tz, { color: theme.textMuted }]}>
                  {item.timeZone.replace('_', ' ')}
                </Text>
              </View>
              <Text style={[styles.cityTime, { color: theme.text }]}>
                {time}
                {meridiem ? <Text style={{ color: theme.accent, fontSize: 14 }}> {meridiem}</Text> : null}
              </Text>
            </View>
          );
        }}
      />

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.title, { color: theme.text }]}>Choose cities</Text>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 16 }}>Done</Text>
              </Pressable>
            </View>
            <FlatList
              data={AVAILABLE_CITIES}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <Pressable
                    onPress={() => toggleCity(item.id)}
                    style={[styles.pickerRow, { borderColor: theme.border }]}
                  >
                    <Text style={{ color: theme.text, fontSize: 16 }}>{item.name}</Text>
                    <Text style={{ color: selected ? theme.accent : theme.textMuted, fontWeight: '700' }}>
                      {selected ? '✓ Added' : 'Add'}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: { fontSize: 24, fontWeight: '700' },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  cityName: { fontSize: 18, fontWeight: '600' },
  tz: { fontSize: 13, marginTop: 2 },
  cityTime: { fontSize: 30, fontWeight: '300', fontVariant: ['tabular-nums'] },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '75%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
});
