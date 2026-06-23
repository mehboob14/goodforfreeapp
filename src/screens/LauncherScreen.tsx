import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DigitalClock from '../components/DigitalClock';
import { useSettings } from '../context/SettingsContext';
import { Article, fetchPosts } from '../api/wordpress';
import {
  gffNativeAvailable,
  getInstalledApps,
  launchApp,
  isDefaultLauncher,
  openHomeSettings,
  InstalledApp,
} from '../native/gffnative';

export default function LauncherScreen() {
  const { theme } = useSettings();
  const navigation = useNavigation<any>();

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(gffNativeAvailable);
  const [featured, setFeatured] = useState<Article | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (gffNativeAvailable) {
      setIsDefault(isDefaultLauncher());
      getInstalledApps()
        .then(setApps)
        .finally(() => setLoadingApps(false));
    }
    fetchPosts({ perPage: 1, page: 1 })
      .then(({ articles }) => setFeatured(articles[0] ?? null))
      .catch(() => {});
  }, []);

  const openFeatured = useCallback(() => {
    if (!featured) return;
    navigation.navigate('Articles', {
      screen: 'ArticleDetail',
      params: { id: featured.id, title: featured.title },
    });
  }, [featured, navigation]);

  const header = (
    <View>
      <View style={styles.clockWrap}>
        <DigitalClock size={56} />
      </View>

      {featured ? (
        <Pressable
          onPress={openFeatured}
          style={[styles.featured, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          {featured.imageUrl ? (
            <Image source={{ uri: featured.imageUrl }} style={styles.featuredImg} />
          ) : null}
          <View style={styles.featuredBody}>
            <Text style={[styles.featuredKicker, { color: theme.accent }]}>
              {(featured.categories[0] || 'Featured').toUpperCase()}
            </Text>
            <Text numberOfLines={2} style={[styles.featuredTitle, { color: theme.text }]}>
              {featured.title}
            </Text>
            <Text style={[styles.featuredCta, { color: theme.textMuted }]}>Read on GoodForFree →</Text>
          </View>
        </Pressable>
      ) : null}

      {gffNativeAvailable && !isDefault ? (
        <Pressable
          onPress={openHomeSettings}
          style={[styles.setDefault, { borderColor: theme.accent }]}
        >
          <Text style={{ color: theme.accent, fontWeight: '700' }}>
            Set GoodForFree as default home app
          </Text>
        </Pressable>
      ) : null}

      <Text style={[styles.appsHeading, { color: theme.textMuted }]}>APPS</Text>
    </View>
  );

  // In Expo Go / iOS the native module isn't available, so there's no app list.
  if (!gffNativeAvailable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        {header}
        <Text style={[styles.notice, { color: theme.textMuted }]}>
          The app launcher (installed apps grid) works in the built Android app — not in Expo Go or
          on iOS.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={apps}
        keyExtractor={(a) => a.packageName}
        numColumns={4}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        columnWrapperStyle={{ justifyContent: 'flex-start' }}
        ListEmptyComponent={
          loadingApps ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 24 }} />
          ) : (
            <Text style={{ color: theme.textMuted, marginTop: 16 }}>No apps found.</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.appCell} onPress={() => launchApp(item.packageName)}>
            {item.icon ? (
              <Image source={{ uri: item.icon }} style={styles.appIcon} />
            ) : (
              <View style={[styles.appIcon, styles.appIconFallback, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>
                  {item.label.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text numberOfLines={1} style={[styles.appLabel, { color: theme.text }]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  clockWrap: { alignItems: 'center', paddingVertical: 16 },
  featured: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  featuredImg: { width: 96, height: 96 },
  featuredBody: { flex: 1, padding: 12, justifyContent: 'center' },
  featuredKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  featuredTitle: { fontSize: 15, fontWeight: '700', marginTop: 4, lineHeight: 20 },
  featuredCta: { fontSize: 12, marginTop: 6 },
  setDefault: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 14 },
  appsHeading: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  notice: { paddingHorizontal: 16, fontSize: 14, lineHeight: 20 },
  appCell: { width: '25%', alignItems: 'center', marginBottom: 18, paddingHorizontal: 4 },
  appIcon: { width: 52, height: 52, borderRadius: 12 },
  appIconFallback: { alignItems: 'center', justifyContent: 'center' },
  appLabel: { fontSize: 11, marginTop: 6, textAlign: 'center' },
});
