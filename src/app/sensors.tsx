import { useKeepAwake } from 'expo-keep-awake';
import { Accelerometer, Barometer, Gyroscope, Magnetometer, Pedometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SensorChart } from '@/components/sensor-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const WINDOW_SIZE = 60;
const UPDATE_INTERVAL_MS = 64;

function magnitude(value: { x: number; y: number; z: number }): number {
  return Math.sqrt(value.x ** 2 + value.y ** 2 + value.z ** 2);
}

function useRollingWindow() {
  const [samples, setSamples] = useState<number[]>([]);
  const push = (value: number) =>
    setSamples((current) => [...current.slice(-(WINDOW_SIZE - 1)), value]);
  return [samples, push] as const;
}

export default function SensorsScreen() {
  // Keep the screen on while streaming sensor data.
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const chartWidth = width - Spacing.three * 2 - Spacing.three * 2;

  const [accelSamples, pushAccel] = useRollingWindow();
  const [gyroSamples, pushGyro] = useRollingWindow();
  const [magSamples, pushMag] = useRollingWindow();
  const [pressure, setPressure] = useState<number | null>(null);
  const [pedometerStatus, setPedometerStatus] = useState('checking…');

  useEffect(() => {
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);
    Magnetometer.setUpdateInterval(UPDATE_INTERVAL_MS);

    const subscriptions = [
      Accelerometer.addListener((data) => pushAccel(magnitude(data))),
      Gyroscope.addListener((data) => pushGyro(magnitude(data))),
      Magnetometer.addListener((data) => pushMag(magnitude(data))),
      Barometer.addListener((data) => setPressure(data.pressure)),
    ];

    Pedometer.isAvailableAsync()
      .then((available) => setPedometerStatus(available ? 'available' : 'not available'))
      .catch(() => setPedometerStatus('not available'));

    return () => {
      for (const subscription of subscriptions) {
        subscription.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = (samples: number[], unit: string) =>
    samples.length > 0 ? `${samples[samples.length - 1].toFixed(3)} ${unit}` : '—';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        <ThemedText themeColor="textSecondary">
          Live device motion streamed at ~15Hz and rendered with Skia.
        </ThemedText>

        <SensorChart
          title="Accelerometer (g)"
          color="#208AEF"
          samples={accelSamples}
          latestLabel={latest(accelSamples, 'g')}
          width={chartWidth}
        />
        <SensorChart
          title="Gyroscope (rad/s)"
          color="#10B981"
          samples={gyroSamples}
          latestLabel={latest(gyroSamples, 'rad/s')}
          width={chartWidth}
        />
        <SensorChart
          title="Magnetometer (µT)"
          color="#F59E0B"
          samples={magSamples}
          latestLabel={latest(magSamples, 'µT')}
          width={chartWidth}
        />

        <View style={styles.metaRow}>
          <ThemedView type="backgroundElement" style={styles.metaCard}>
            <ThemedText type="smallBold">Barometer</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              {pressure !== null ? `${pressure.toFixed(1)} hPa` : 'unavailable'}
            </ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.metaCard}>
            <ThemedText type="smallBold">Pedometer</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              {pedometerStatus}
            </ThemedText>
          </ThemedView>
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
    padding: Spacing.three,
    gap: Spacing.three,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metaCard: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
