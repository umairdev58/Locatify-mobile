import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  onHide: () => void;
}

export default function Toast({ visible, message, type, onHide }: ToastProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'exclamation-circle';
      case 'info':
        return 'info-circle';
      default:
        return 'check-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#34C759'; // Apple green
      case 'error':
        return '#FF3B30'; // Apple red
      case 'info':
        return '#007AFF'; // Apple blue
      default:
        return '#34C759';
    }
  };

  const getBackgroundColor = () => {
    return colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: getBackgroundColor(),
          top: Platform.OS === 'ios' ? Math.max(insets.top + 8, 60) : 60,
        },
      ]}>
      <View style={styles.content}>
        <FontAwesome name={getIcon()} size={20} color={getIconColor()} style={styles.icon} />
        <Text
          style={[
            styles.message,
            { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' },
          ]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.2,
  },
});

