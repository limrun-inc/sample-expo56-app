import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe, type CardFieldInput } from '@stripe/stripe-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logActivity } from '@/lib/db';

const PERKS = [
  { icon: 'flash' as const, title: 'Priority feed sync', detail: 'Background refresh every 15 minutes' },
  { icon: 'cloud-upload' as const, title: '4K media uploads', detail: 'No compression on photos and videos' },
  { icon: 'color-palette' as const, title: 'Exclusive themes', detail: 'Including the mesh gradient pack' },
];

export default function PaymentsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Pulls the Stripe SDK instance through the provider to exercise the native module.
  useStripe();

  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const subscribe = async () => {
    if (!cardDetails?.complete || processing) return;
    setProcessing(true);
    setResult(null);
    try {
      // A real integration would create a PaymentIntent on a backend and call
      // confirmPayment here. This demo stops at native card tokenization UI.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setResult('Card validated. Subscription simulated — no backend attached.');
      await logActivity('payments', `Validated ${cardDetails.brand ?? 'card'} ending in Stripe CardField`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        <LinearGradient
          colors={['#F59E0B', '#EF4444', '#D946EF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}>
          <ThemedText type="subtitle" style={styles.bannerTitle}>
            Pulse Premium
          </ThemedText>
          <ThemedText type="small" style={styles.bannerSubtitle}>
            $4.99 / month · cancel anytime
          </ThemedText>
        </LinearGradient>

        <View style={styles.perks}>
          {PERKS.map((perk) => (
            <ThemedView key={perk.title} type="backgroundElement" style={styles.perkRow}>
              <Ionicons name={perk.icon} size={20} color="#208AEF" />
              <View style={styles.perkText}>
                <ThemedText type="smallBold">{perk.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {perk.detail}
                </ThemedText>
              </View>
            </ThemedView>
          ))}
        </View>

        <View style={styles.cardSection}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            PAYMENT DETAILS (STRIPE TEST MODE)
          </ThemedText>
          <CardField
            postalCodeEnabled={false}
            placeholders={{ number: '4242 4242 4242 4242' }}
            cardStyle={{
              backgroundColor: theme.backgroundElement,
              textColor: theme.text,
              placeholderColor: theme.textSecondary,
              borderRadius: 12,
            }}
            style={styles.cardField}
            onCardChange={setCardDetails}
          />
        </View>

        <Pressable onPress={subscribe} disabled={!cardDetails?.complete || processing}>
          <View
            style={[
              styles.subscribeButton,
              { opacity: cardDetails?.complete && !processing ? 1 : 0.5 },
            ]}>
            <ThemedText type="smallBold" style={styles.subscribeLabel}>
              {processing ? 'Processing…' : 'Start subscription'}
            </ThemedText>
          </View>
        </Pressable>

        {result ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.result}>
            {result}
          </ThemedText>
        ) : null}
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
  banner: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  bannerTitle: {
    color: '#ffffff',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
  },
  perks: {
    gap: Spacing.two,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 14,
    padding: Spacing.three,
  },
  perkText: {
    flex: 1,
    gap: Spacing.half,
  },
  cardSection: {
    gap: Spacing.two,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  subscribeButton: {
    backgroundColor: '#208AEF',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  subscribeLabel: {
    color: '#ffffff',
    fontSize: 16,
  },
  result: {
    textAlign: 'center',
  },
});
