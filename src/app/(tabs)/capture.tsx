import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions, type BarcodeScanningResult, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Button, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { insertPost, logActivity } from '@/lib/db';

type CapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

export default function CaptureScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!permission) {
    return <ThemedView style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.permissionText}>
          The Capture studio needs camera access to take photos and scan QR codes.
        </ThemedText>
        <Button title="Grant camera permission" onPress={requestPermission} />
      </ThemedView>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (result) {
        setPhoto({ uri: result.uri, width: result.width, height: result.height });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, width: asset.width ?? 1000, height: asset.height ?? 1000 });
    }
  };

  const publishPhoto = async () => {
    if (!photo || busy) return;
    setBusy(true);
    setStatusMessage('Processing image…');
    try {
      // Downscale on the native thread before publishing.
      const context = ImageManipulator.manipulate(photo.uri);
      const rendered = await context.resize({ width: 1080 }).renderAsync();
      const saved = await rendered.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });

      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (mediaPermission.granted) {
        await MediaLibrary.saveToLibraryAsync(saved.uri);
      }

      await insertPost({
        caption: `Shot from the Capture studio at ${new Date().toLocaleTimeString()}`,
        imageUrl: saved.uri,
        imageAspectRatio: saved.width / saved.height,
      });
      await logActivity('capture', 'Published a photo to the feed');
      queryClient.invalidateQueries({ queryKey: ['feed'] });

      setStatusMessage('Published to your feed!');
      setPhoto(null);
    } catch (error) {
      setStatusMessage(`Failed: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    setScannedCode(result.data);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (photo) {
    return (
      <ThemedView style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="contain" />
        <View style={[styles.previewActions, { paddingBottom: BottomTabInset + insets.bottom + Spacing.three }]}>
          {statusMessage ? (
            <ThemedText type="small" themeColor="textSecondary">
              {statusMessage}
            </ThemedText>
          ) : null}
          <View style={styles.previewButtons}>
            <Button title="Discard" color="#EF4444" onPress={() => setPhoto(null)} />
            <Button title={busy ? 'Publishing…' : 'Publish to feed'} onPress={publishPhoto} disabled={busy} />
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {isFocused ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
      ) : (
        <View style={styles.camera} />
      )}

      {scannedCode ? (
        <Pressable
          style={[styles.scanBanner, { top: insets.top + Spacing.two, backgroundColor: theme.backgroundElement }]}
          onPress={() => setScannedCode(null)}>
          <Ionicons name="qr-code" size={16} color={theme.text} />
          <ThemedText type="small" numberOfLines={1} style={styles.scanText}>
            {scannedCode}
          </ThemedText>
          <Ionicons name="close" size={16} color={theme.textSecondary} />
        </Pressable>
      ) : null}

      <View style={[styles.controls, { paddingBottom: BottomTabInset + insets.bottom + Spacing.three }]}>
        <Pressable style={styles.sideButton} onPress={pickFromLibrary}>
          <Ionicons name="images" size={26} color="#ffffff" />
        </Pressable>
        <Pressable style={styles.shutterOuter} onPress={takePhoto} disabled={busy}>
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={styles.sideColumn}>
          <Pressable
            style={styles.sideButton}
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}>
            <Ionicons name="camera-reverse" size={26} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.sideButton} onPress={() => setTorch((value) => !value)}>
            <Ionicons name={torch ? 'flash' : 'flash-off'} size={22} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  permissionText: {
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  scanBanner: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  scanText: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  sideColumn: {
    gap: Spacing.two,
  },
  sideButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ffffff',
  },
  preview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewActions: {
    padding: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  previewButtons: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
});
