import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function AddressCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      {/* Banner Skeleton */}
      <View style={styles.banner}>
        <Animated.View style={[styles.bannerShimmer, { opacity }]} />
      </View>

      {/* Address Code Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.labelSkeleton}>
          <Animated.View style={[styles.shimmer, { opacity, width: 120, height: 12 }]} />
        </View>
        <View style={styles.codeRow}>
          <Animated.View style={[styles.shimmer, { opacity, flex: 1, height: 24 }]} />
          <Animated.View style={[styles.shimmer, { opacity, width: 40, height: 40, borderRadius: 8 }]} />
        </View>
      </View>

      {/* Coordinates Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.labelSkeleton}>
          <Animated.View style={[styles.shimmer, { opacity, width: 100, height: 12 }]} />
        </View>
        <Animated.View style={[styles.shimmer, { opacity, width: '60%', height: 18 }]} />
      </View>

      {/* Photos Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.labelSkeleton}>
          <Animated.View style={[styles.shimmer, { opacity, width: 140, height: 12 }]} />
        </View>
        <View style={styles.photosRow}>
          <Animated.View style={[styles.shimmer, { opacity, width: 100, height: 100, borderRadius: 12 }]} />
          <Animated.View style={[styles.shimmer, { opacity, width: 100, height: 100, borderRadius: 12 }]} />
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionButtons}>
        <Animated.View style={[styles.shimmer, { opacity, flex: 1, height: 44, borderRadius: 12, marginRight: 12 }]} />
        <Animated.View style={[styles.shimmer, { opacity, flex: 1, height: 44, borderRadius: 12, marginRight: 12 }]} />
        <Animated.View style={[styles.shimmer, { opacity, flex: 1, height: 44, borderRadius: 12 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  banner: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F4F6',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  labelSkeleton: {
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shimmer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
  },
});

