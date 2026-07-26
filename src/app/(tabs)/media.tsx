import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as Speech from 'expo-speech';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/lib/format';
import { useAppStore } from '@/store/app-store';

const VIDEO_SOURCES = [
  {
    label: 'Big Buck Bunny',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    label: 'Elephants Dream',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    label: 'Sintel',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
];

const AUDIO_SOURCE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/audio/ForBiggerBlazes.mp3';

export default function MediaScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const videoAutoplay = useAppStore((state) => state.videoAutoplay);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  const videoPlayer = useVideoPlayer(
    { uri: VIDEO_SOURCES[0].uri, useCaching: true },
    (player) => {
      player.loop = true;
      player.muted = true;
      if (videoAutoplay) {
        player.play();
      }
    }
  );

  const audioPlayer = useAudioPlayer(AUDIO_SOURCE);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const voiceNotePlayer = useAudioPlayer(recordedUri ? { uri: recordedUri } : null);

  const switchVideoSource = (index: number) => {
    setSourceIndex(index);
    videoPlayer.replaceAsync({ uri: VIDEO_SOURCES[index].uri, useCaching: true });
    videoPlayer.play();
  };

  const grabThumbnail = async () => {
    const { uri } = await VideoThumbnails.getThumbnailAsync(VIDEO_SOURCES[sourceIndex].uri, {
      time: 12_000,
    });
    setThumbnailUri(uri);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleAudio = () => {
    if (audioStatus.playing) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  const startRecording = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecordingState('recording');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const stopRecording = async () => {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setRecordedUri(recorder.uri);
    setRecordingState('recorded');
  };

  const playVoiceNote = () => {
    voiceNotePlayer.seekTo(0);
    voiceNotePlayer.play();
  };

  const speakDescription = () => {
    Speech.speak('This screen exercises video playback, audio streaming, recording and text to speech.', {
      rate: 1.0,
    });
  };

  const audioProgress = audioStatus.duration > 0 ? audioStatus.currentTime / audioStatus.duration : 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + insets.bottom + Spacing.four },
        ]}>
        <ThemedText type="subtitle">Media Lab</ThemedText>

        <View style={styles.sectionGap}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            VIDEO — STREAMING, CACHE, PiP
          </ThemedText>
          <VideoView
            player={videoPlayer}
            style={styles.video}
            allowsPictureInPicture
            contentFit="cover"
          />
          <View style={styles.chipRow}>
            {VIDEO_SOURCES.map((source, index) => (
              <Pressable key={source.uri} onPress={() => switchVideoSource(index)}>
                <ThemedView
                  type={index === sourceIndex ? 'backgroundSelected' : 'backgroundElement'}
                  style={styles.chip}>
                  <ThemedText type="small">{source.label}</ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </View>
          <View style={styles.chipRow}>
            <Pressable onPress={grabThumbnail}>
              <ThemedView type="backgroundElement" style={styles.chip}>
                <ThemedText type="small">Grab thumbnail @ 12s</ThemedText>
              </ThemedView>
            </Pressable>
            {thumbnailUri ? <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} /> : null}
          </View>
        </View>

        <View style={styles.sectionGap}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            AUDIO — REMOTE STREAM
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.audioCard}>
            <Pressable onPress={toggleAudio} style={[styles.playButton, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name={audioStatus.playing ? 'pause' : 'play'} size={22} color={theme.text} />
            </Pressable>
            <View style={styles.audioBody}>
              <ThemedText type="smallBold">For Bigger Blazes</ThemedText>
              <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
                <View style={[styles.progressFill, { width: `${Math.min(audioProgress * 100, 100)}%` }]} />
              </View>
              <ThemedText type="code" themeColor="textSecondary">
                {formatDuration(audioStatus.currentTime)} / {formatDuration(audioStatus.duration)}
              </ThemedText>
            </View>
          </ThemedView>
        </View>

        <View style={styles.sectionGap}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            VOICE NOTES — RECORDING
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.audioCard}>
            <Pressable
              onPress={recordingState === 'recording' ? stopRecording : startRecording}
              style={[
                styles.playButton,
                { backgroundColor: recordingState === 'recording' ? '#EF4444' : theme.backgroundSelected },
              ]}>
              <Ionicons
                name={recordingState === 'recording' ? 'stop' : 'mic'}
                size={22}
                color={recordingState === 'recording' ? '#ffffff' : theme.text}
              />
            </Pressable>
            <View style={styles.audioBody}>
              <ThemedText type="smallBold">
                {recordingState === 'recording'
                  ? 'Recording…'
                  : recordingState === 'recorded'
                    ? 'Voice note ready'
                    : 'Tap to record a voice note'}
              </ThemedText>
              {recordingState === 'recorded' ? (
                <Pressable onPress={playVoiceNote}>
                  <ThemedText type="linkPrimary">Play it back</ThemedText>
                </Pressable>
              ) : null}
            </View>
          </ThemedView>
        </View>

        <View style={styles.sectionGap}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            TEXT TO SPEECH
          </ThemedText>
          <Pressable onPress={speakDescription}>
            <ThemedView type="backgroundElement" style={styles.speechRow}>
              <Ionicons name="chatbox-ellipses" size={20} color={theme.text} />
              <ThemedText type="small" style={styles.speechText}>
                Describe this screen out loud
              </ThemedText>
            </ThemedView>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  sectionGap: {
    gap: Spacing.two,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: '#000',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  chip: {
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  thumbnail: {
    width: 64,
    height: 36,
    borderRadius: 6,
  },
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBody: {
    flex: 1,
    gap: Spacing.one,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#208AEF',
    borderRadius: 3,
  },
  speechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
  },
  speechText: {
    flex: 1,
  },
});
