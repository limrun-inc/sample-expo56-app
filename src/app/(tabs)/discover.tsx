import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logActivity } from '@/lib/db';
import { MAP_INITIAL_CAMERA, PLACES } from '@/lib/mock-data';
import type { Place } from '@/lib/types';

export default function DiscoverScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const markers = PLACES.map((place) => ({
    coordinates: { latitude: place.latitude, longitude: place.longitude },
    title: place.name,
  }));

  const locateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationStatus('Location permission denied');
      return;
    }
    setLocationStatus('Locating…');
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setLocationStatus(
      `You are at ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
    );
    await logActivity('location', 'Fetched current position');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mapContainer}>
        {Platform.OS === 'ios' ? (
          <AppleMaps.View
            style={StyleSheet.absoluteFill}
            cameraPosition={MAP_INITIAL_CAMERA}
            markers={markers}
          />
        ) : Platform.OS === 'android' ? (
          <GoogleMaps.View
            style={StyleSheet.absoluteFill}
            cameraPosition={MAP_INITIAL_CAMERA}
            markers={markers}
          />
        ) : (
          <View style={styles.mapFallback}>
            <ThemedText themeColor="textSecondary">Maps are only available on Android and iOS.</ThemedText>
          </View>
        )}

        <Pressable
          style={[styles.locateButton, { top: insets.top + Spacing.two, backgroundColor: theme.backgroundElement }]}
          onPress={locateMe}>
          <Ionicons name="locate" size={20} color={theme.text} />
        </Pressable>

        {locationStatus ? (
          <View style={[styles.statusPill, { top: insets.top + Spacing.two, backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small">{locationStatus}</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sheetTitle}>
          NEARBY SPOTS
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.placeRow, { paddingBottom: BottomTabInset + Spacing.two }]}>
          {PLACES.map((place) => {
            const selected = selectedPlace?.id === place.id;
            return (
              <Pressable
                key={place.id}
                onPress={() => {
                  setSelectedPlace(place);
                  Haptics.selectionAsync();
                }}>
                <ThemedView
                  type={selected ? 'backgroundSelected' : 'backgroundElement'}
                  style={styles.placeCard}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {place.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {place.category}
                  </ThemedText>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <ThemedText type="small">{place.rating.toFixed(1)}</ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateButton: {
    position: 'absolute',
    right: Spacing.three,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statusPill: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three + 56,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sheet: {
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  sheetTitle: {
    fontSize: 12,
    letterSpacing: 1,
    paddingHorizontal: Spacing.three,
  },
  placeRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  placeCard: {
    width: 190,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
