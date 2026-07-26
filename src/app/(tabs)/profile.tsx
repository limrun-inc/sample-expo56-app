import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Application from 'expo-application';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Network from 'expo-network';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsRow, SettingsSection } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { fetchActivity, getDbStats, logActivity } from '@/lib/db';
import { timeAgo } from '@/lib/format';
import { USERS } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';

const SESSION_TOKEN_KEY = 'benchmark.session.token';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const handle = useAppStore((state) => state.handle);
  const displayName = useAppStore((state) => state.displayName);
  const profileLocked = useAppStore((state) => state.profileLocked);
  const setProfileLocked = useAppStore((state) => state.setProfileLocked);
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useAppStore((state) => state.setHapticsEnabled);
  const videoAutoplay = useAppStore((state) => state.videoAutoplay);
  const setVideoAutoplay = useAppStore((state) => state.setVideoAutoplay);

  const [manuallyUnlocked, setManuallyUnlocked] = useState(false);
  const unlocked = !profileLocked || manuallyUnlocked;
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const statsQuery = useQuery({ queryKey: ['db-stats'], queryFn: getDbStats });
  const activityQuery = useQuery({ queryKey: ['activity'], queryFn: () => fetchActivity(8) });

  useEffect(() => {
    Battery.getBatteryLevelAsync().then(setBatteryLevel).catch(() => {});
    Network.getNetworkStateAsync()
      .then((state) => setNetworkType(state.type ?? 'unknown'))
      .catch(() => {});
    SecureStore.getItemAsync(SESSION_TOKEN_KEY).then(setSessionToken).catch(() => {});
  }, []);

  const unlockWithBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      // No biometrics on this device/simulator; unlock directly.
      setManuallyUnlocked(true);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your profile',
    });
    if (result.success) {
      setManuallyUnlocked(true);
      await logActivity('auth', 'Profile unlocked with biometrics');
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const rotateSessionToken = async () => {
    const token = `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
    setSessionToken(token);
    await logActivity('auth', 'Rotated session token in SecureStore');
  };

  if (!unlocked) {
    return (
      <ThemedView style={styles.lockedContainer}>
        <Ionicons name="lock-closed" size={48} color="#208AEF" />
        <ThemedText type="subtitle">Profile locked</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.lockedHint}>
          Authenticate with Face ID, Touch ID, or your device credentials to continue.
        </ThemedText>
        <Button title="Unlock" onPress={unlockWithBiometrics} />
      </ThemedView>
    );
  }

  const stats = statsQuery.data;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + insets.bottom + Spacing.four },
        ]}>
        <LinearGradient
          colors={['#0EA5E9', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.four }]}>
          <Image source={{ uri: USERS[0].avatarUrl }} style={styles.avatar} />
          <ThemedText type="subtitle" style={styles.headerName}>
            {displayName}
          </ThemedText>
          <ThemedText type="small" style={styles.headerHandle}>
            @{handle}
          </ThemedText>
          <View style={styles.statRow}>
            <HeaderStat label="Posts" value={stats ? `${stats.posts}` : '—'} />
            <HeaderStat label="Comments" value={stats ? `${stats.comments}` : '—'} />
            <HeaderStat label="Events" value={stats ? `${stats.activity}` : '—'} />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <SettingsSection title="Preferences">
            <SettingsRow
              icon="finger-print"
              title="Require biometric unlock"
              subtitle="Lock the profile tab behind Face ID / fingerprint"
              trailing={
                <Switch
                  value={profileLocked}
                  onValueChange={(value) => {
                    setProfileLocked(value);
                    setManuallyUnlocked(false);
                  }}
                />
              }
            />
            <SettingsRow
              icon="radio-button-on"
              title="Haptic feedback"
              trailing={<Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} />}
            />
            <SettingsRow
              icon="play"
              title="Autoplay videos"
              trailing={<Switch value={videoAutoplay} onValueChange={setVideoAutoplay} />}
            />
          </SettingsSection>

          <SettingsSection title="Security">
            <SettingsRow
              icon="key"
              title="Session token"
              subtitle={sessionToken ? `${sessionToken.slice(0, 24)}… (SecureStore)` : 'No token stored yet'}
              onPress={rotateSessionToken}
            />
          </SettingsSection>

          <SettingsSection title="Explore the native surface">
            <SettingsRow
              icon="pulse"
              title="Sensor Lab"
              subtitle="Accelerometer, gyroscope, magnetometer with Skia charts"
              onPress={() => router.push('/sensors')}
            />
            <SettingsRow
              icon="card"
              title="Go Premium"
              subtitle="Stripe payment sheet integration"
              onPress={() => router.push('/payments')}
            />
            <SettingsRow
              icon="globe"
              title="In-App Browser"
              subtitle="WebView with navigation controls"
              onPress={() => router.push('/browser')}
            />
            <SettingsRow
              icon="construct"
              title="System Toolbox"
              subtitle="Notifications, background sync, files, updates and more"
              onPress={() => router.push('/settings')}
            />
          </SettingsSection>

          <SettingsSection title="Device">
            <SettingsRow
              icon="phone-portrait"
              title={`${Device.manufacturer ?? 'Unknown'} ${Device.modelName ?? 'device'}`}
              subtitle={`${Device.osName} ${Device.osVersion} · App ${Application.nativeApplicationVersion ?? '1.0.0'} (${Application.nativeBuildVersion ?? '1'})`}
            />
            <SettingsRow
              icon="battery-half"
              title="Battery"
              subtitle={batteryLevel !== null ? `${Math.round(batteryLevel * 100)}%` : 'Unavailable'}
            />
            <SettingsRow icon="wifi" title="Network" subtitle={String(networkType)} />
          </SettingsSection>

          <SettingsSection title="Recent activity">
            {(activityQuery.data ?? []).length === 0 ? (
              <SettingsRow
                icon="time"
                title="No activity yet"
                subtitle="Actions across the app are logged into SQLite"
              />
            ) : (
              (activityQuery.data ?? []).map((event) => (
                <SettingsRow
                  key={event.id}
                  icon="time"
                  title={event.detail}
                  subtitle={`${event.kind} · ${timeAgo(event.createdAt)} ago`}
                />
              ))
            )}
          </SettingsSection>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  lockedHint: {
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingBottom: Spacing.four,
    gap: Spacing.one,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  headerName: {
    color: '#ffffff',
  },
  headerHandle: {
    color: 'rgba(255,255,255,0.85)',
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.five,
    marginTop: Spacing.three,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
  },
  body: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
});
