import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HOME_URL = 'https://docs.expo.dev/versions/v56.0.0/';

export default function BrowserScreen() {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [progress, setProgress] = useState(0);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.toolbar, { backgroundColor: theme.backgroundElement }]}>
        <Pressable disabled={!canGoBack} onPress={() => webViewRef.current?.goBack()}>
          <Ionicons name="chevron-back" size={22} color={canGoBack ? theme.text : theme.textSecondary} />
        </Pressable>
        <Pressable disabled={!canGoForward} onPress={() => webViewRef.current?.goForward()}>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={canGoForward ? theme.text : theme.textSecondary}
          />
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.urlLabel}>
          {currentUrl}
        </ThemedText>
        <Pressable onPress={() => webViewRef.current?.reload()}>
          <Ionicons name="refresh" size={20} color={theme.text} />
        </Pressable>
      </View>

      {progress < 1 ? (
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      ) : null}

      <WebView
        ref={webViewRef}
        source={{ uri: HOME_URL }}
        style={styles.webView}
        onLoadProgress={(event) => setProgress(event.nativeEvent.progress)}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCanGoForward(navState.canGoForward);
          setCurrentUrl(navState.url);
        }}
        allowsBackForwardNavigationGestures
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  urlLabel: {
    flex: 1,
  },
  progressTrack: {
    height: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#208AEF',
  },
  webView: {
    flex: 1,
  },
});
