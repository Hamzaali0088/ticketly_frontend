import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  message,
  primaryButtonText = 'OK',
  onPrimaryPress,
  secondaryButtonText,
  onSecondaryPress,
}) => {
  const handlePrimaryPress = () => {
    if (onPrimaryPress) {
      onPrimaryPress();
    }
    onClose();
  };

  const handleSecondaryPress = () => {
    if (onSecondaryPress) {
      onSecondaryPress();
    }
    onClose();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70 justify-center items-center p-5" onPress={onClose}>
        <Pressable className="bg-[#1F1F1F] rounded-2xl p-6 w-full max-w-[400px]" onPress={(e) => e.stopPropagation()}>
          {title && <Text className="text-white text-xl font-bold mb-3 text-center">{title}</Text>}
          <Text className="text-[#D1D5DB] text-base leading-6 mb-6 text-center">{message}</Text>
          <View className="flex-row gap-3">
            {secondaryButtonText && (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center bg-[#2F2F2F]"
                onPress={handleSecondaryPress}
              >
                <Text className="text-white text-base font-semibold">{secondaryButtonText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center bg-[#9333EA]"
              onPress={handlePrimaryPress}
            >
              <Text className="text-white text-base font-semibold">{primaryButtonText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

