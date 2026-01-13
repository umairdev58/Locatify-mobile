import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function PlaceCardSkeleton() {
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
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Animated.View style={[styles.shimmer, { opacity, width: '60%', height: 28 }]} />
        <Animated.View style={[styles.shimmer, { opacity, width: '80%', height: 16, marginTop: 8 }]} />
      </View>

      {/* Content Skeleton */}
      <View style={styles.content}>
        {/* Notes Section */}
        <View style={styles.section}>
          <Animated.View style={[styles.shimmer, { opacity, width: 60, height: 12, marginBottom: 8 }]} />
          <View style={styles.notesBox}>
            <Animated.View style={[styles.shimmer, { opacity, width: '100%', height: 16, marginBottom: 8 }]} />
            <Animated.View style={[styles.shimmer, { opacity, width: '80%', height: 16 }]} />
          </View>
        </View>

        {/* Coordinates Section */}
        <View style={styles.section}>
          <Animated.View style={[styles.shimmer, { opacity, width: 100, height: 12, marginBottom: 8 }]} />
          <View style={styles.coordinatesBox}>
            <Animated.View style={[styles.shimmer, { opacity, width: '70%', height: 18 }]} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Animated.View style={[styles.shimmer, { opacity, flex: 1, height: 44, borderRadius: 12, marginRight: 12 }]} />
          <Animated.View style={[styles.shimmer, { opacity, flex: 1, height: 44, borderRadius: 12 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#F97316',
    padding: 20,
    paddingBottom: 16,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 16,
  },
  notesBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
  },
  coordinatesBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  shimmer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
});

