import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import type { ImageAsset } from '@/types/image';

type Props = {
  images: ImageAsset[];
  onImagesChange: (images: ImageAsset[]) => void;
  maxImages?: number;
};

export default function ImageUploader({ images, onImagesChange, maxImages = 4 }: Props) {
  const canAddMore = images.length < maxImages;

  const handleAdd = async () => {
    if (!canAddMore) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to upload house images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: 'base64',
    });
    const nextImage: ImageAsset = {
      uri: asset.uri,
      name: asset.fileName ?? `photo-${Date.now()}.jpg`,
      type: asset.type ?? 'image/jpeg',
      base64,
    };
    onImagesChange([...images, nextImage]);
  };

  const handleRemove = (index: number) => {
    const nextImages = images.filter((_, idx) => idx !== index);
    onImagesChange(nextImages);
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewRow}>
        {images.map((image, index) => (
          <View key={`${image.uri}-${index}`} style={styles.thumbnailWrapper}>
            <Image source={{ uri: image.uri }} style={styles.thumbnail} />
            <Pressable style={styles.removeButton} onPress={() => handleRemove(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ))}
        {canAddMore ? (
          <Pressable style={styles.addCard} onPress={handleAdd}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        ) : (
          <View style={[styles.addCard, styles.addCardDisabled]}>
            <Text style={styles.maxText}>Max {maxImages}</Text>
          </View>
        )}
      </View>
      <Text style={styles.helpText}>
        {images.length}/{maxImages} photos staged
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111427',
    marginRight: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderBottomLeftRadius: 8,
  },
  removeText: {
    color: '#fff',
    fontSize: 11,
  },
  addCard: {
    width: 84,
    height: 84,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5d5cff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    marginRight: 12,
    marginBottom: 12,
  },
  addCardDisabled: {
    borderColor: '#cfd2e5',
    backgroundColor: '#f3f3f5',
  },
  addIcon: {
    fontSize: 28,
    color: '#5d5cff',
    fontWeight: '600',
  },
  addText: {
    fontSize: 12,
    color: '#3c3f6b',
  },
  maxText: {
    fontSize: 12,
    color: '#6f6f87',
    fontWeight: '600',
  },
  helpText: {
    marginTop: 8,
    fontSize: 13,
    color: '#7a809c',
  },
});

