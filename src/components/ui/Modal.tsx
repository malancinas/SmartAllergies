import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
}

export function Modal({ visible, onClose, title, children, footer, testID }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <TouchableWithoutFeedback>
            <View className="w-full bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden">
              {title ? (
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-100 dark:border-neutral-700">
                  <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {title}
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <Text className="text-2xl text-neutral-400">×</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View className="px-4 py-4">{children}</View>

              {footer ? (
                <View className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-700">
                  {footer}
                </View>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
