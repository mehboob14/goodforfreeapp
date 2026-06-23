import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import {
  Article,
  Category,
  fetchPosts,
  fetchCategories,
} from '../api/wordpress';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ArticlesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ArticlesStackParamList, 'ArticlesList'>;

export default function ArticlesScreen({ navigation }: Props) {
  const { theme } = useSettings();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (opts: { page: number; append: boolean; search: string; categoryId?: number }) => {
      try {
        setError(null);
        if (opts.append) setLoadingMore(true);
        else if (!refreshing) setLoading(true);

        const { articles: fetched, totalPages: tp } = await fetchPosts({
          page: opts.page,
          perPage: 10,
          search: opts.search || undefined,
          categoryId: opts.categoryId,
        });

        setTotalPages(tp);
        setArticles((prev) => (opts.append ? [...prev, ...fetched] : fetched));
      } catch (e: any) {
        setError(e?.message ?? 'Could not load articles');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [refreshing]
  );

  // Initial + whenever category/search change (search is debounced).
  useEffect(() => {
    setPage(1);
    load({ page: 1, append: false, search, categoryId: activeCategory });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const onChangeSearch = (text: string) => {
    setSearch(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setPage(1);
      load({ page: 1, append: false, search: text, categoryId: activeCategory });
    }, 450);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load({ page: 1, append: false, search, categoryId: activeCategory });
  };

  const onEndReached = () => {
    if (loadingMore || loading) return;
    if (page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    load({ page: next, append: true, search, categoryId: activeCategory });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Text style={[styles.title, { color: theme.text }]}>Articles</Text>

      <TextInput
        value={search}
        onChangeText={onChangeSearch}
        placeholder="Search articles…"
        placeholderTextColor={theme.textMuted}
        style={[
          styles.search,
          { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
        ]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
      >
        <Chip
          label="All"
          active={activeCategory === undefined}
          onPress={() => setActiveCategory(undefined)}
          theme={theme}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            active={activeCategory === c.id}
            onPress={() => setActiveCategory(c.id)}
            theme={theme}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 12 }}>
            {error}
          </Text>
          <Pressable
            onPress={onRefresh}
            style={[styles.retry, { backgroundColor: theme.accent }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(a) => String(a.id)}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40 }}>
              No articles found.
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={theme.accent} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              theme={theme}
              onPress={() =>
                navigation.navigate('ArticleDetail', { id: item.id, title: item.title })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function ArticleCard({
  article,
  theme,
  onPress,
}: {
  article: Article;
  theme: ReturnType<typeof useSettings>['theme'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      {article.imageUrl ? (
        <Image source={{ uri: article.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: theme.surfaceAlt }]} />
      )}
      <View style={styles.cardBody}>
        {article.categories[0] ? (
          <Text style={[styles.cardCategory, { color: theme.accent }]}>
            {article.categories[0].toUpperCase()}
          </Text>
        ) : null}
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={[styles.cardExcerpt, { color: theme.textMuted }]} numberOfLines={2}>
          {article.excerpt}
        </Text>
        <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
          {article.author ? `${article.author} · ` : ''}
          {new Date(article.date).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
}

function Chip({
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
        styles.chip,
        {
          backgroundColor: active ? theme.accent : theme.surface,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={{ color: active ? '#fff' : theme.textMuted, fontWeight: '600', fontSize: 13 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', paddingHorizontal: 16, paddingTop: 8 },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipsScroll: { flexGrow: 0, flexShrink: 0 },
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retry: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 180 },
  cardBody: { padding: 14 },
  cardCategory: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  cardExcerpt: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  cardMeta: { fontSize: 12, marginTop: 10 },
});
