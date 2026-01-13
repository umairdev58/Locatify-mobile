import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: 'destructive' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'default',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const scale = React.useRef(new Animated.Value(0.9)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const backgroundColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? '#AEAEB2' : '#6B7280';
  const borderColor = isDark ? '#38383A' : '#E5E7EB';
  const destructiveColor = '#FF3B30';
  const destructiveBg = isDark ? '#3A1F1F' : '#FEE2E2';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Animated.View
          style={[
            styles.backdropOverlay,
            {
              opacity: backdropOpacity,
            },
          ]}
        />
      </Pressable>
      <View style={styles.container} pointerEvents="box-none">
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
          <Animated.View
            style={[
              styles.modalBox,
              {
                backgroundColor,
                transform: [{ scale }],
                opacity,
              },
            ]}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    confirmButtonStyle === 'destructive' ? destructiveBg : '#E0F2FE',
                },
              ]}>
              <FontAwesome
                name={confirmButtonStyle === 'destructive' ? 'exclamation-triangle' : 'question-circle'}
                size={32}
                color={confirmButtonStyle === 'destructive' ? destructiveColor : '#3B82F6'}
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>

            {/* Message */}
            <Text style={[styles.message, { color: secondaryTextColor }]}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton, { borderColor }]}
                onPress={handleCancel}>
                <Text style={[styles.cancelButtonText, { color: textColor }]}>{cancelText}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.confirmButton,
                  confirmButtonStyle === 'destructive' && {
                    backgroundColor: destructiveColor,
                  },
                  confirmButtonStyle === 'default' && {
                    backgroundColor: '#3B82F6',
                  },
                ]}
                onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

