import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppState = {
  handle: string;
  displayName: string;
  hapticsEnabled: boolean;
  videoAutoplay: boolean;
  profileLocked: boolean;
  storiesSeen: string[];
  setHandle: (handle: string) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setVideoAutoplay: (enabled: boolean) => void;
  setProfileLocked: (locked: boolean) => void;
  markStorySeen: (id: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      handle: 'aurora.dev',
      displayName: 'Aurora Lindqvist',
      hapticsEnabled: true,
      videoAutoplay: true,
      profileLocked: false,
      storiesSeen: [],
      setHandle: (handle) => set({ handle }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setVideoAutoplay: (videoAutoplay) => set({ videoAutoplay }),
      setProfileLocked: (profileLocked) => set({ profileLocked }),
      markStorySeen: (id) =>
        set((state) =>
          state.storiesSeen.includes(id) ? state : { storiesSeen: [...state.storiesSeen, id] }
        ),
    }),
    {
      name: 'benchmark-app-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
