import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHtml from 'react-native-render-html';
import { useSettings } from '../context/SettingsContext';
import { Article, fetchPost, WP_BASE_URL } from '../api/wordpress';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ArticlesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ArticlesStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route }: Props) {
  const { id } = route.params;
  const { theme } = useSettings();
  const { width } = useWindowDimensions();

  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchPost(id, controller.signal)
      .then(setArticle)
      .catch((e) => setError(e?.message ?? 'Could not load article'));
    return () => controller.abort();
  }, [id]);

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textMuted }}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.hero} />
        ) : null}
        <View style={styles.body}>
          {article.categories[0] ? (
            <Text style={[styles.category, { color: theme.accent }]}>
              {article.categories[0].toUpperCase()}
            </Text>
          ) : null}
          <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>
            {article.author ? `${article.author} · ` : ''}
            {new Date(article.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          <RenderHtml
            contentWidth={width - 32}
            source={{ html: article.contentHtml }}
            baseStyle={{ color: theme.text, fontSize: 16, lineHeight: 26 }}
            tagsStyles={{
              a: { color: theme.accent },
              p: { marginBottom: 14 },
              h2: { color: theme.text, marginTop: 8 },
              h3: { color: theme.text },
              li: { color: theme.text },
              img: { borderRadius: 8 },
            }}
            systemFonts={['System']}
            enableExperimentalMarginCollapsing
          />

          <Pressable
            onPress={() => Linking.openURL(article.link || WP_BASE_URL)}
            style={[styles.openBtn, { borderColor: theme.border }]}
          >
            <Text style={{ color: theme.accent, fontWeight: '700' }}>Open in browser ↗</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 240 },
  body: { padding: 16 },
  category: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  meta: { fontSize: 13, marginTop: 10, marginBottom: 18 },
  openBtn: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
