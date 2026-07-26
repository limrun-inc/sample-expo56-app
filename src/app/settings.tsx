import * as Brightness from 'expo-brightness';
import * as Calendar from 'expo-calendar';
import * as Clipboard from 'expo-clipboard';
import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { getLocales } from 'expo-localization';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import * as ScreenCapture from 'expo-screen-capture';
import * as StoreReview from 'expo-store-review';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import * as Updates from 'expo-updates';
import { clearVideoCacheAsync, getCurrentVideoCacheSize } from 'expo-video';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsRow, SettingsSection } from '@/components/settings-row';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  backgroundTaskStatus,
  isFeedSyncRegistered,
  registerFeedSync,
  unregisterFeedSync,
} from '@/lib/background-tasks';
import { fetchActivity, logActivity } from '@/lib/db';
import { formatBytes } from '@/lib/format';
import {
  cancelAllReminders,
  getScheduledCount,
  scheduleEngagementReminder,
} from '@/lib/notifications';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const [scheduledCount, setScheduledCount] = useState(0);
  const [syncRegistered, setSyncRegistered] = useState(false);
  const [syncStatus, setSyncStatus] = useState('unknown');
  const [videoCacheSize, setVideoCacheSize] = useState<number | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [calendarInfo, setCalendarInfo] = useState<string | null>(null);
  const [contactsInfo, setContactsInfo] = useState<string | null>(null);
  const [hashResult, setHashResult] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [captureBlocked, setCaptureBlocked] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);

  const locale = getLocales()[0];

  const refreshCounters = async () => {
    setScheduledCount(await getScheduledCount());
    setSyncRegistered(await isFeedSyncRegistered());
    const status = await backgroundTaskStatus();
    setSyncStatus(status === 2 ? 'available' : status === 1 ? 'restricted' : 'unknown');
    try {
      setVideoCacheSize(getCurrentVideoCacheSize());
    } catch {
      setVideoCacheSize(null);
    }
  };

  useEffect(() => {
    // State updates happen inside async continuations, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCounters();
  }, []);

  const toggleBackgroundSync = async (enable: boolean) => {
    if (enable) {
      await registerFeedSync();
    } else {
      await unregisterFeedSync();
    }
    await refreshCounters();
  };

  const writeDiagnosticsReport = async () => {
    const reportsDir = new Directory(Paths.cache, 'reports');
    if (!reportsDir.exists) {
      reportsDir.create();
    }
    const file = new File(reportsDir, `report-${Date.now()}.json`);
    const activity = await fetchActivity(100);
    file.write(JSON.stringify({ generatedAt: new Date().toISOString(), activity }, null, 2));
    setReportStatus(
      `Wrote ${file.name} (${formatBytes(file.size ?? 0)}) · disk free ${formatBytes(Paths.availableDiskSpace)}`
    );
    await logActivity('files', `Wrote diagnostics report ${file.name}`);
  };

  const clearVideoCache = async () => {
    await clearVideoCacheAsync();
    await refreshCounters();
  };

  const inspectCalendars = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      setCalendarInfo('Calendar permission denied');
      return;
    }
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    setCalendarInfo(`${calendars.length} calendars on this device`);
  };

  const inspectContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      setContactsInfo('Contacts permission denied');
      return;
    }
    const { data } = await Contacts.getContactsAsync({ pageSize: 1 });
    setContactsInfo(`Access granted · first page returned ${data.length} contact(s)`);
  };

  const hashActivityLog = async () => {
    const activity = await fetchActivity(100);
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      JSON.stringify(activity)
    );
    setHashResult(`SHA-256: ${digest.slice(0, 24)}…`);
    await Clipboard.setStringAsync(digest);
  };

  const checkForUpdates = async () => {
    try {
      setUpdateStatus('Checking…');
      const result = await Updates.checkForUpdateAsync();
      setUpdateStatus(result.isAvailable ? 'Update available! Fetching…' : 'App is up to date.');
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateStatus('Update downloaded — restart to apply.');
      }
    } catch (error) {
      setUpdateStatus(`Not available here: ${String(error).slice(0, 80)}`);
    }
  };

  const toggleCaptureProtection = async (enable: boolean) => {
    if (enable) {
      await ScreenCapture.preventScreenCaptureAsync();
    } else {
      await ScreenCapture.allowScreenCaptureAsync();
    }
    setCaptureBlocked(enable);
  };

  const requestTracking = async () => {
    const { status } = await requestTrackingPermissionsAsync();
    setTrackingStatus(`Tracking permission: ${status}`);
  };

  const printActivityReport = async () => {
    const activity = await fetchActivity(30);
    const rows = activity
      .map((event) => `<tr><td>${event.kind}</td><td>${event.detail}</td></tr>`)
      .join('');
    await Print.printAsync({
      html: `<h1>Pulse activity report</h1><table border="1" cellpadding="6">${rows}</table>`,
    });
  };

  const emailSupport = async () => {
    if (await MailComposer.isAvailableAsync()) {
      await MailComposer.composeAsync({
        recipients: ['support@example.com'],
        subject: 'Pulse feedback',
        body: 'Sent from the benchmark super app.',
      });
    }
  };

  const bumpBrightness = async () => {
    const { status } = await Brightness.requestPermissionsAsync();
    if (status === 'granted') {
      await Brightness.setBrightnessAsync(1);
    }
  };

  const askForReview = async () => {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        <SettingsSection title="Notifications">
          <SettingsRow
            icon="notifications"
            title="Schedule a reminder in 10 seconds"
            subtitle={`${scheduledCount} notification(s) currently scheduled`}
            onPress={async () => {
              await scheduleEngagementReminder(10);
              await refreshCounters();
            }}
          />
          <SettingsRow
            icon="notifications-off"
            title="Cancel all scheduled notifications"
            onPress={async () => {
              await cancelAllReminders();
              await refreshCounters();
            }}
          />
        </SettingsSection>

        <SettingsSection title="Background sync">
          <SettingsRow
            icon="sync"
            title="Feed sync every 15 minutes"
            subtitle={`WorkManager / BGTaskScheduler · service ${syncStatus}`}
            trailing={<Switch value={syncRegistered} onValueChange={toggleBackgroundSync} />}
          />
        </SettingsSection>

        <SettingsSection title="Storage">
          <SettingsRow
            icon="document-text"
            title="Write diagnostics report"
            subtitle={reportStatus ?? `Cache dir: ${Paths.cache.uri}`}
            onPress={writeDiagnosticsReport}
          />
          <SettingsRow
            icon="film"
            title="Clear video cache"
            subtitle={videoCacheSize !== null ? `Currently ${formatBytes(videoCacheSize)}` : 'Size unavailable'}
            onPress={clearVideoCache}
          />
          <SettingsRow
            icon="shield-checkmark"
            title="Hash activity log (SHA-256)"
            subtitle={hashResult ?? 'Digest is copied to the clipboard'}
            onPress={hashActivityLog}
          />
        </SettingsSection>

        <SettingsSection title="OTA updates">
          <SettingsRow
            icon="cloud-download"
            title="Check for updates"
            subtitle={
              updateStatus ??
              `Channel: ${Updates.channel || 'none'} · Runtime: ${Updates.runtimeVersion || 'dev'}`
            }
            onPress={checkForUpdates}
          />
        </SettingsSection>

        <SettingsSection title="System integrations">
          <SettingsRow
            icon="calendar"
            title="Inspect calendars"
            subtitle={calendarInfo ?? 'Requests calendar permission'}
            onPress={inspectCalendars}
          />
          <SettingsRow
            icon="people"
            title="Inspect contacts"
            subtitle={contactsInfo ?? 'Requests contacts permission'}
            onPress={inspectContacts}
          />
          <SettingsRow icon="print" title="Print activity report" onPress={printActivityReport} />
          <SettingsRow icon="mail" title="Email support" onPress={emailSupport} />
          <SettingsRow icon="sunny" title="Max out screen brightness" onPress={bumpBrightness} />
          <SettingsRow icon="star" title="Ask for a store review" onPress={askForReview} />
          {Platform.OS === 'ios' ? (
            <SettingsRow
              icon="eye"
              title="App tracking transparency"
              subtitle={trackingStatus ?? 'Requests the ATT prompt'}
              onPress={requestTracking}
            />
          ) : null}
        </SettingsSection>

        <SettingsSection title="Privacy">
          <SettingsRow
            icon="lock-closed"
            title="Block screenshots"
            subtitle="Uses expo-screen-capture"
            trailing={<Switch value={captureBlocked} onValueChange={toggleCaptureProtection} />}
          />
        </SettingsSection>

        <SettingsSection title="Locale">
          <SettingsRow
            icon="language"
            title={locale?.languageTag ?? 'Unknown locale'}
            subtitle={`Currency: ${locale?.currencyCode ?? '—'} · Region: ${locale?.regionCode ?? '—'} · ${
              locale?.measurementSystem ?? 'metric'
            } units`}
          />
        </SettingsSection>
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
    gap: Spacing.four,
  },
});
