import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { StoryRail } from '@/components/story-rail';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchPostsPage, searchPosts, toggleLike } from '@/lib/db';
import type { Post } from '@/lib/types';

const PAGE_SIZE = 10;

export default function FeedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  });

  const searchQuery = useQuery({
    queryKey: ['feed-search', searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: searchTerm.trim().length > 1,
  });

  const likeMutation = useMutation({
    mutationFn: (post: Post) => toggleLike(post.id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-search'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });

  const searching = searchTerm.trim().length > 1;
  const posts = searching
    ? (searchQuery.data ?? [])
    : (feedQuery.data?.pages.flat() ?? []);

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['#208AEF', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.hero, { paddingTop: insets.top + Spacing.two }]}>
        <View style={styles.heroRow}>
          <ThemedText type="subtitle" style={styles.heroTitle}>
            Pulse
          </ThemedText>
          <Link href="/settings">
            <Ionicons name="cog-outline" size={26} color="#ffffff" />
          </Link>
        </View>
        <View style={[styles.searchBox, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Ionicons name="search" size={16} color="#ffffff" />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search captions (SQLite FTS5)"
            placeholderTextColor="rgba(255,255,255,0.7)"
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>
      </LinearGradient>

      {feedQuery.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : (
        <FlashList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} onToggleLike={(post) => likeMutation.mutate(post)} />
          )}
          ListHeaderComponent={searching ? undefined : <StoryRail />}
          ListEmptyComponent={
            <View style={styles.loading}>
              <ThemedText themeColor="textSecondary">
                {searching ? 'No posts match that search.' : 'Nothing here yet.'}
              </ThemedText>
            </View>
          }
          onEndReached={() => {
            if (!searching && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
              feedQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.6}
          refreshControl={
            <RefreshControl
              refreshing={feedQuery.isRefetching}
              onRefresh={() => feedQuery.refetch()}
              tintColor={theme.text}
            />
          }
          contentContainerStyle={{
            paddingTop: Spacing.two,
            paddingBottom: BottomTabInset + insets.bottom + Spacing.three,
          }}
          ListFooterComponent={
            feedQuery.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerSpinner} color="#208AEF" />
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#ffffff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.two + Spacing.one,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.two,
    color: '#ffffff',
    fontSize: 14,
  },
  loading: {
    flex: 1,
    paddingTop: Spacing.six,
    alignItems: 'center',
  },
  footerSpinner: {
    marginVertical: Spacing.three,
  },
});
