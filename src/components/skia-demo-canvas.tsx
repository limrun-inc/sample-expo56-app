import { Canvas, Circle, Group, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CanvasWidth = 240;
const CanvasHeight = 96;

export default function SkiaDemoCanvas() {
  const theme = useTheme();
  const isDark = theme.background === '#000000';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Canvas style={styles.canvas} __destroyWebGLContextAfterRender>
        <RoundedRect
          x={0}
          y={0}
          width={CanvasWidth}
          height={CanvasHeight}
          r={24}
          color={isDark ? '#121826' : '#EAF3FF'}
        />
        <Circle cx={72} cy={48} r={34} color="#208AEF" />
        <Group opacity={0.88}>
          <Circle cx={92} cy={34} r={18} color="#62D0FF" />
          <Circle cx={104} cy={60} r={22} color="#7C3AED" />
        </Group>
        <RoundedRect x={132} y={28} width={78} height={40} r={20} color="#34D399" />
      </Canvas>
      <ThemedText type="smallBold" style={styles.message}>
        Skia is working
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    alignSelf: 'stretch',
  },
  canvas: {
    width: CanvasWidth,
    height: CanvasHeight,
  },
  message: {
    textAlign: 'center',
  },
});
