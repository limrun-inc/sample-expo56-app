import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { useAppStore } from '@/store/app-store';

export default function TabsLayout() {
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#208AEF',
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
        tabBarBackground:
          Platform.OS === 'ios'
            ? () => <BlurView tint="systemChromeMaterial" intensity={100} style={StyleSheet.absoluteFill} />
            : undefined,
      }}
      screenListeners={{
        tabPress: () => {
          if (hapticsEnabled) {
            Haptics.selectionAsync();
          }
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Capture',
          tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Media',
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
