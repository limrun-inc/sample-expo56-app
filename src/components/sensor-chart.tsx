import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

const CHART_HEIGHT = 96;

type SensorChartProps = {
  title: string;
  color: string;
  /** Rolling window of samples, newest last. */
  samples: number[];
  latestLabel: string;
  width: number;
};

export function SensorChart({ title, color, samples, latestLabel, width }: SensorChartProps) {
  const path = useMemo(() => {
    const skPath = Skia.Path.Make();
    if (samples.length < 2 || width <= 0) return skPath;

    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const range = Math.max(max - min, 0.0001);
    const stepX = width / (samples.length - 1);

    samples.forEach((sample, index) => {
      const x = index * stepX;
      const y = CHART_HEIGHT - ((sample - min) / range) * (CHART_HEIGHT - 12) - 6;
      if (index === 0) {
        skPath.moveTo(x, y);
      } else {
        skPath.lineTo(x, y);
      }
    });
    return skPath;
  }, [samples, width]);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="code" themeColor="textSecondary">
          {latestLabel}
        </ThemedText>
      </View>
      <Canvas style={{ width, height: CHART_HEIGHT }}>
        <Path path={path} style="stroke" strokeWidth={2.5} color={color} strokeJoin="round" />
      </Canvas>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
