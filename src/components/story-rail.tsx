import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { STORIES } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';

export function StoryRail() {
  const storiesSeen = useAppStore((state) => state.storiesSeen);
  const markStorySeen = useAppStore((state) => state.markStorySeen);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {STORIES.map((story) => {
        const seen = story.seen || storiesSeen.includes(story.id);
        return (
          <Pressable key={story.id} style={styles.item} onPress={() => markStorySeen(story.id)}>
            <LinearGradient
              colors={seen ? ['#9CA3AF', '#6B7280'] : ['#F59E0B', '#EF4444', '#D946EF']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.ring}>
              <View style={styles.avatarHole}>
                <Image source={{ uri: story.avatarUrl }} style={styles.avatar} />
              </View>
            </LinearGradient>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.handle}>
              {story.authorHandle}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHole: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  handle: {
    marginTop: Spacing.one,
    maxWidth: 72,
    fontSize: 12,
  },
});
