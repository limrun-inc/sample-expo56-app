import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { compactNumber, timeAgo } from '@/lib/format';
import type { Post } from '@/lib/types';
import { useAppStore } from '@/store/app-store';

const BLURHASH_PLACEHOLDER = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

type PostCardProps = {
  post: Post;
  onToggleLike: (post: Post) => void;
};

export function PostCard({ post, onToggleLike }: PostCardProps) {
  const theme = useTheme();
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);

  const heartScale = useSharedValue(0);
  const likeButtonScale = useSharedValue(1);

  const triggerLike = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleLike(post);
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(280)
    .onStart(() => {
      heartScale.value = withSequence(
        withSpring(1, { damping: 12, stiffness: 220 }),
        withTiming(0, { duration: 350 })
      );
      runOnJS(triggerLike)();
    });

  const heartOverlayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartScale.value,
  }));

  const likeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeButtonScale.value }],
  }));

  const onLikePress = () => {
    // Mutating Reanimated shared values in handlers is the intended API.
    // eslint-disable-next-line react-hooks/immutability
    likeButtonScale.value = withSequence(
      withSpring(1.35, { damping: 10, stiffness: 300 }),
      withSpring(1)
    );
    triggerLike();
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <Image source={{ uri: post.avatarUrl }} style={styles.avatar} recyclingKey={post.id} />
        <View style={styles.headerText}>
          <ThemedText type="smallBold">{post.authorHandle}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {timeAgo(post.createdAt)} ago
          </ThemedText>
        </View>
      </View>

      <GestureDetector gesture={doubleTap}>
        <View>
          <Image
            source={{ uri: post.imageUrl }}
            placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
            style={[styles.image, { aspectRatio: post.imageAspectRatio }]}
            contentFit="cover"
            transition={200}
            recyclingKey={post.id}
          />
          <Animated.View style={[styles.heartOverlay, heartOverlayStyle]} pointerEvents="none">
            <Ionicons name="heart" size={96} color="#ffffff" />
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.actions}>
        <Animated.View style={likeButtonStyle}>
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={26}
            color={post.likedByMe ? '#F43F5E' : theme.text}
            onPress={onLikePress}
          />
        </Animated.View>
        <Link href={{ pathname: '/post/[id]', params: { id: post.id } }}>
          <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
        </Link>
        <View style={styles.actionSpacer} />
        <ThemedText type="small" themeColor="textSecondary">
          {compactNumber(post.likeCount)} likes · {post.commentCount} comments
        </ThemedText>
      </View>

      <View style={styles.captionRow}>
        <ThemedText type="small">
          <ThemedText type="smallBold">{post.authorHandle}</ThemedText> {post.caption}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two + Spacing.one,
  },
  headerText: {
    gap: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  image: {
    width: '100%',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two + Spacing.one,
  },
  actionSpacer: {
    flex: 1,
  },
  captionRow: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.three,
  },
});
