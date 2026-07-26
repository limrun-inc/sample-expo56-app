import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addComment, fetchComments, fetchPost, logActivity, toggleLike } from '@/lib/db';
import { compactNumber, timeAgo } from '@/lib/format';
import { useAppStore } from '@/store/app-store';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const handle = useAppStore((state) => state.handle);

  const shotTargetRef = useRef<View>(null);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const postQuery = useQuery({ queryKey: ['post', id], queryFn: () => fetchPost(id) });
  const commentsQuery = useQuery({ queryKey: ['comments', id], queryFn: () => fetchComments(id) });

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => addComment(id, handle, body),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const post = postQuery.data;

  const copyCaption = async () => {
    if (!post) return;
    await Clipboard.setStringAsync(post.caption);
    setToast('Caption copied to clipboard');
    Haptics.selectionAsync();
  };

  const sharePost = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      setToast('Sharing is not available here');
      return;
    }
    if (!shotTargetRef.current) return;
    const shot = await captureRef(shotTargetRef, { format: 'png', result: 'tmpfile' });
    await Sharing.shareAsync(shot.startsWith('file://') ? shot : `file://${shot}`, {
      dialogTitle: 'Share this post',
    });
    await logActivity('share', `Shared post ${id} as a snapshot`);
  };

  if (!post) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary">
          {postQuery.isLoading ? 'Loading post…' : 'Post not found.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View ref={shotTargetRef} collapsable={false}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.header}>
                <Image source={{ uri: post.avatarUrl }} style={styles.avatar} />
                <View>
                  <ThemedText type="smallBold">{post.authorHandle}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {timeAgo(post.createdAt)} ago
                  </ThemedText>
                </View>
              </View>
              <Image
                source={{ uri: post.imageUrl }}
                style={[styles.image, { aspectRatio: post.imageAspectRatio }]}
                contentFit="cover"
              />
              <View style={styles.captionBlock}>
                <ThemedText type="small">
                  <ThemedText type="smallBold">{post.authorHandle}</ThemedText> {post.caption}
                </ThemedText>
              </View>
            </ThemedView>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.action} onPress={() => likeMutation.mutate()}>
              <Ionicons
                name={post.likedByMe ? 'heart' : 'heart-outline'}
                size={24}
                color={post.likedByMe ? '#F43F5E' : theme.text}
              />
              <ThemedText type="small">{compactNumber(post.likeCount)}</ThemedText>
            </Pressable>
            <Pressable style={styles.action} onPress={copyCaption}>
              <Ionicons name="copy-outline" size={22} color={theme.text} />
              <ThemedText type="small">Copy</ThemedText>
            </Pressable>
            <Pressable style={styles.action} onPress={sharePost}>
              <Ionicons name="share-outline" size={22} color={theme.text} />
              <ThemedText type="small">Share</ThemedText>
            </Pressable>
          </View>

          {toast ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.toast}>
              {toast}
            </ThemedText>
          ) : null}

          <View style={styles.comments}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              COMMENTS ({commentsQuery.data?.length ?? 0})
            </ThemedText>
            {(commentsQuery.data ?? []).map((comment) => (
              <ThemedView key={comment.id} type="backgroundElement" style={styles.comment}>
                <ThemedText type="small">
                  <ThemedText type="smallBold">{comment.authorHandle}</ThemedText> {comment.body}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {timeAgo(comment.createdAt)} ago
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.composer,
            { backgroundColor: theme.backgroundElement, paddingBottom: insets.bottom + Spacing.two },
          ]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={`Comment as @${handle}`}
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
            multiline
          />
          <Pressable
            onPress={() => draft.trim() && commentMutation.mutate(draft.trim())}
            disabled={!draft.trim() || commentMutation.isPending}>
            <Ionicons
              name="send"
              size={22}
              color={draft.trim() ? '#208AEF' : theme.textSecondary}
            />
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  image: {
    width: '100%',
  },
  captionBlock: {
    padding: Spacing.three,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.five,
    paddingHorizontal: Spacing.two,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  toast: {
    paddingHorizontal: Spacing.two,
  },
  comments: {
    gap: Spacing.two,
  },
  comment: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxHeight: 110,
    fontSize: 14,
  },
});
