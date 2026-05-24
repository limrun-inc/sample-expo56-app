import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function SkiaDemo() {
  return (
    <WithSkiaWeb
      fallback={
        <ThemedView type="backgroundElement" style={styles.loadingCard}>
          <ThemedText type="smallBold">Loading Skia...</ThemedText>
        </ThemedView>
      }
      getComponent={() => import('@/components/skia-demo-canvas')}
      opts={{
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.41.0/bin/full/${file}`,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: Spacing.four,
    padding: Spacing.three,
  },
});
