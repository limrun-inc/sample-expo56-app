import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type SettingsRowProps = {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  disabled?: boolean;
};

export function SettingsRow({ icon, title, subtitle, onPress, trailing, disabled }: SettingsRowProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} disabled={disabled || !onPress}>
      {({ pressed }) => (
        <ThemedView
          type={pressed ? 'backgroundSelected' : 'backgroundElement'}
          style={[styles.row, disabled && styles.disabled]}>
          <View style={[styles.iconBubble, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name={icon} size={18} color={theme.text} />
          </View>
          <View style={styles.textColumn}>
            <ThemedText type="small">{title}</ThemedText>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} /> : null)}
        </ThemedView>
      )}
    </Pressable>
  );
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  disabled: {
    opacity: 0.5,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: Spacing.half,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1,
    paddingHorizontal: Spacing.three,
  },
  sectionBody: {
    borderRadius: 16,
    overflow: 'hidden',
    gap: StyleSheet.hairlineWidth,
  },
});
